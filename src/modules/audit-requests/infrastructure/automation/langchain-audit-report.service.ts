import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MetricsService } from '../../../../common/interfaces/metrics/metrics.service';
import {
  invokeWithLlmTracking,
  type LlmInvocationContext,
  type LlmInvocationOptions,
} from '../../../../common/infrastructure/llm/llm-usage-tracking.util';
import { z } from 'zod';
import {
  AuditLocale,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  CHAT_OPENAI_FACTORY,
  type ChatOpenAIFactory,
} from './chat-openai.factory';
import type {
  LangchainAuditGenerateOptions,
  LangchainAuditInput,
  LangchainAuditOutput,
  LlmSynthesisProgressEvent,
} from './contracts/langchain-contracts';
import {
  buildExpertSynthesis,
  resolveProfile,
} from './langchain-synthesis.util';
import {
  buildFallbackExpertReport,
  buildFallbackSummary,
  ensurePriorityDepth,
  withDeterministicCost,
} from './langchain-fallback-report.builder';
import { DeadlineBudget, withHardTimeout } from './llm-execution.guardrails';
import {
  UNTRUSTED_DATA_DISCLAIMER_EN,
  UNTRUSTED_DATA_DISCLAIMER_FR,
  wrapUntrustedUserPayload,
} from './shared/prompt-sanitize.util';
import {
  clientCommsRetryConstraint,
  clientCommsSystemMain,
  executiveRetryConstraint,
  executiveSystemMain,
  executionRetryConstraint,
  executionSystemMain,
  expertReportCompactConstraint,
  expertReportRetryConstraint,
  expertReportStrictConstraint,
  expertReportSystemMain,
  priorityRetryConstraint,
  prioritySystemMain,
  PROMPT_VERSION,
  userSummaryRetryConstraint,
  userSummarySystemMain,
} from './prompts/v1/audit-system-prompts';
import { LLM_EXECUTOR, type LlmExecutor } from './llm-executor.port';
import {
  ReportQualityGateContext,
  ReportQualityGateResult,
  ReportQualityGateService,
} from './report-quality-gate.service';
import {
  buildPayload as buildLlmPayload,
  buildSectionPayloads as buildLlmSectionPayloads,
  payloadBytes as payloadBytesUtil,
} from './llm-payload.builder';
import { isTimeoutError } from './shared/error.util';
import { localizedText } from './shared/locale-text.util';

/**
 * Re-exports des contrats publics du service. Les consommateurs
 * externes a `automation/` doivent importer via ce fichier afin de
 * conserver un unique point d'entree (verifie par le guardrail ESLint).
 */
export type {
  LangchainAuditGenerateOptions,
  LangchainAuditInput,
  LangchainAuditOutput,
  LlmSynthesisProgressEvent,
  SynthesisSectionName,
} from './contracts/langchain-contracts';

const userSummarySchema = z.object({
  summaryText: z.string().min(1),
});

const diagnosticChaptersSchema = z.object({
  conversionAndClarity: z.string(),
  speedAndPerformance: z.string(),
  seoFoundations: z.string(),
  credibilityAndTrust: z.string(),
  techAndScalability: z.string(),
  scorecardAndBusinessOpportunities: z.string(),
});

const techFingerprintSchema = z.object({
  primaryStack: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  alternatives: z.array(z.string()),
  unknowns: z.array(z.string()),
});

const engineScoreInputSchema = z.object({
  engine: z.enum(['google', 'bing_chatgpt', 'perplexity', 'gemini_overviews']),
  score: z.number().min(0).max(100),
  indexable: z.boolean(),
  strengths: z.array(z.string()).max(5),
  blockers: z.array(z.string()).max(5),
  opportunities: z.array(z.string()).max(5),
});

const engineCoverageInputSchema = z.object({
  google: engineScoreInputSchema,
  bingChatGpt: engineScoreInputSchema,
  perplexity: engineScoreInputSchema,
  geminiOverviews: engineScoreInputSchema,
});

const perPageDetailedAnalysisSchema = z.object({
  url: z.string().min(1),
  title: z.string(),
  engineScores: engineCoverageInputSchema,
  topIssues: z.array(z.string()).max(6),
  recommendations: z.array(z.string()).max(6),
  evidence: z.array(z.string()).max(6),
});

const clientEmailDraftSchema = z.object({
  subject: z.string().min(1).max(100),
  body: z.string().min(1),
});

const expertReportSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
  diagnosticChapters: diagnosticChaptersSchema,
  techFingerprint: techFingerprintSchema,
  perPageAnalysis: z.array(perPageDetailedAnalysisSchema),
  clientEmailDraft: clientEmailDraftSchema,
  internalNotes: z.string(),
  priorities: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
      whyItMatters: z.string(),
      recommendedFix: z.string(),
      estimatedHours: z.number().min(0).max(200),
    }),
  ),
  urlLevelImprovements: z.array(
    z.object({
      url: z.string(),
      issue: z.string(),
      recommendation: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
    }),
  ),
  implementationTodo: z.array(
    z.object({
      phase: z.string(),
      objective: z.string(),
      deliverable: z.string(),
      estimatedHours: z.number().min(0).max(200),
      dependencies: z.array(z.string()),
    }),
  ),
  whatToFixThisWeek: z.array(
    z.object({
      task: z.string(),
      goal: z.string(),
      estimatedHours: z.number().min(0).max(200),
      risk: z.string(),
      dependencies: z.array(z.string()),
    }),
  ),
  whatToFixThisMonth: z.array(
    z.object({
      task: z.string(),
      goal: z.string(),
      estimatedHours: z.number().min(0).max(400),
      risk: z.string(),
      dependencies: z.array(z.string()),
    }),
  ),
  clientMessageTemplate: z.string(),
  clientLongEmail: z.string(),
  fastImplementationPlan: z.array(
    z.object({
      task: z.string(),
      whyItMatters: z.string(),
      implementationSteps: z.array(z.string()),
      estimatedHours: z.number().min(0).max(200),
      expectedImpact: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
  implementationBacklog: z.array(
    z.object({
      task: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      details: z.string(),
      estimatedHours: z.number().min(0).max(400),
      dependencies: z.array(z.string()),
      acceptanceCriteria: z.array(z.string()),
    }),
  ),
  invoiceScope: z.array(
    z.object({
      item: z.string(),
      description: z.string(),
      estimatedHours: z.number().min(0).max(200),
    }),
  ),
});

const executiveSectionSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
  scorecardAndBusinessOpportunities: z.string(),
});

const prioritySectionSchema = z.object({
  priorities: expertReportSchema.shape.priorities,
  urlLevelImprovements: expertReportSchema.shape.urlLevelImprovements,
  seoFoundations: z.string(),
});

const executionSectionSchema = z.object({
  implementationTodo: expertReportSchema.shape.implementationTodo,
  whatToFixThisWeek: expertReportSchema.shape.whatToFixThisWeek,
  whatToFixThisMonth: expertReportSchema.shape.whatToFixThisMonth,
  fastImplementationPlan: expertReportSchema.shape.fastImplementationPlan,
  implementationBacklog: expertReportSchema.shape.implementationBacklog,
  invoiceScope: expertReportSchema.shape.invoiceScope,
  conversionAndClarity: z.string(),
  speedAndPerformance: z.string(),
  credibilityAndTrust: z.string(),
  techAndScalability: z.string(),
  techFingerprint: techFingerprintSchema,
  perPageAnalysis: expertReportSchema.shape.perPageAnalysis,
  internalNotes: expertReportSchema.shape.internalNotes,
});

const clientCommsSectionSchema = z.object({
  clientMessageTemplate: expertReportSchema.shape.clientMessageTemplate,
  clientLongEmail: expertReportSchema.shape.clientLongEmail,
  clientEmailDraft: expertReportSchema.shape.clientEmailDraft,
});

export type ExpertReport = z.infer<typeof expertReportSchema>;
type ExecutiveSection = z.infer<typeof executiveSectionSchema>;
type PrioritySection = z.infer<typeof prioritySectionSchema>;
type ExecutionSection = z.infer<typeof executionSectionSchema>;
type ClientCommsSection = z.infer<typeof clientCommsSectionSchema>;
type FanoutSectionName =
  | 'executiveSection'
  | 'prioritySection'
  | 'executionSection'
  | 'clientCommsSection';

@Injectable()
export class LangchainAuditReportService {
  private readonly logger = new Logger(LangchainAuditReportService.name);

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly qualityGate: ReportQualityGateService,
    @Inject(CHAT_OPENAI_FACTORY)
    private readonly chatOpenAIFactory: ChatOpenAIFactory,
    @Inject(LLM_EXECUTOR)
    private readonly llmExecutor: LlmExecutor,
    @Optional()
    private readonly metricsService?: MetricsService,
  ) {}

  /**
   * Construit le contexte d'invocation LLM pour `invokeWithLlmTracking`.
   * Chaque section du pipeline audit attribue sa propre label "section"
   * aux metriques Prometheus (llm_tokens_total, llm_latency_seconds).
   */
  private buildLlmContext(
    section: string,
    locale: AuditLocale,
  ): LlmInvocationContext {
    return { section, locale, model: this.config.llmModel };
  }

  /**
   * Enveloppe `chain.invoke` avec le tracking Prometheus : tokens consommes,
   * latence, statut (success|error). Le handler callback LangChain est
   * transparent pour le flux metier et n'altere pas le resultat parse.
   */
  private invokeTracked<T>(
    chain: { invoke: (messages: any, options?: any) => Promise<T> },
    messages: unknown,
    section: string,
    locale: AuditLocale,
    signal?: AbortSignal,
  ): Promise<T> {
    return invokeWithLlmTracking<T>(
      (m: unknown, o: LlmInvocationOptions) => chain.invoke(m, o),
      messages,
      this.buildLlmContext(section, locale),
      this.metricsService ?? null,
      signal,
    );
  }

  async generate(
    input: LangchainAuditInput,
    options: LangchainAuditGenerateOptions = {},
  ): Promise<LangchainAuditOutput> {
    const locale = resolveAuditLocale(
      input.locale,
      resolveAuditLocale(this.config.llmLanguage, 'fr'),
    );
    const normalizedInput: LangchainAuditInput = {
      ...input,
      locale,
    };

    if (!this.config.openAiApiKey) {
      return this.fallback(
        normalizedInput,
        'OPENAI_API_KEY is missing',
        options,
      );
    }

    const profile = resolveProfile(normalizedInput.auditId, this.config);
    if (profile === 'parallel_sections_v1') {
      try {
        return await this.generateParallelSectionsProfile(
          normalizedInput,
          locale,
          options,
        );
      } catch (error) {
        this.logger.warn(
          `LLM parallel profile failed, fallback to sequential profile: ${String(error)}`,
        );
      }
    }

    return this.generateSequentialProfile(normalizedInput, locale, options);
  }

  private async generateSequentialProfile(
    normalizedInput: LangchainAuditInput,
    locale: AuditLocale,
    options: LangchainAuditGenerateOptions,
  ): Promise<LangchainAuditOutput> {
    const summaryPayload = buildLlmPayload(normalizedInput, 'summary');
    const expertPayload = buildLlmPayload(normalizedInput, 'expert');
    const expertCompactPayload = buildLlmPayload(
      normalizedInput,
      'expert_compact',
    );

    const summaryPayloadBytes = payloadBytesUtil(summaryPayload);
    const expertPayloadBytes = payloadBytesUtil(expertPayload);
    const expertCompactPayloadBytes = payloadBytesUtil(expertCompactPayload);
    this.logger.log(
      `LLM profile=stability_first_sequential model=${this.config.llmModel} summaryTimeoutMs=${this.config.llmSummaryTimeoutMs} expertTimeoutMs=${this.config.llmExpertTimeoutMs} payloadBytes(summary=${summaryPayloadBytes},expert=${expertPayloadBytes},expertCompact=${expertCompactPayloadBytes})`,
    );

    const summaryLlm = this.createLlm(this.config.llmSummaryTimeoutMs);
    const expertLlm = this.createLlm(this.config.llmExpertTimeoutMs);

    try {
      let candidate = await this.generateCandidate(
        summaryLlm,
        expertLlm,
        summaryPayload,
        expertCompactPayload,
        normalizedInput,
        locale,
        false,
      );

      let gate = this.runQualityGate(
        candidate.summaryText,
        ensurePriorityDepth(candidate.report, normalizedInput, locale),
        normalizedInput,
      );
      let retried = false;

      if (
        !gate.valid &&
        candidate.expertSource === 'compact' &&
        !candidate.usedExpertFallback
      ) {
        retried = true;
        this.logger.warn(
          `Report quality gate failed on compact expert pass: ${gate.reasons.join(', ')}`,
        );
        const fullStart = Date.now();
        try {
          const fullExpert = await this.generateExpertReport(
            expertLlm,
            expertPayload,
            locale,
            true,
            false,
          );
          const fullDurationMs = Date.now() - fullStart;
          this.logger.log(
            `LLM expert full pass succeeded in ${fullDurationMs}ms after compact pass.`,
          );
          const retryGate = this.runQualityGate(
            candidate.summaryText,
            ensurePriorityDepth(fullExpert, normalizedInput, locale),
            normalizedInput,
          );
          if (
            retryGate.valid ||
            retryGate.reasons.length <= gate.reasons.length
          ) {
            gate = retryGate;
            candidate = {
              ...candidate,
              report: fullExpert,
              expertSource: 'full',
            };
          }
        } catch (error) {
          const fullDurationMs = Date.now() - fullStart;
          this.logger.warn(
            `LLM expert full pass failed after ${fullDurationMs}ms: ${String(error)}`,
          );
          candidate.warnings.push({
            type: 'expert',
            message: `full pass failed: ${String(error)}`,
          });
        }
      }

      const adminReport = withDeterministicCost(gate.report, locale, {
        rateCurrency: this.config.rateCurrency,
        rateHourlyMin: this.config.rateHourlyMin,
        rateHourlyMax: this.config.rateHourlyMax,
      });
      adminReport.qualityGate = {
        valid: gate.valid,
        reasons: gate.reasons,
        retried,
        fallback: candidate.usedExpertFallback,
      };

      this.applyWarningsToReport(adminReport, candidate.warnings, locale);

      if (!gate.valid) {
        adminReport.qualityWarning = localizedText(
          locale,
          'Sortie normalisee apres echec du quality gate.',
          'Output normalized after quality gate failure.',
        );
      }
      adminReport.llmMeta = {
        profile: 'stability_first_sequential',
        promptVersion: PROMPT_VERSION,
        payloadBytes: {
          summary: summaryPayloadBytes,
          expert: expertPayloadBytes,
          expertCompact: expertCompactPayloadBytes,
        },
      };

      return {
        summaryText: gate.summaryText,
        adminReport,
        expertSynthesis: buildExpertSynthesis(
          gate.summaryText,
          adminReport,
          normalizedInput,
        ),
      };
    } catch (error) {
      this.logger.warn(`LLM generation failed: ${String(error)}`);
      return this.fallback(normalizedInput, String(error), options);
    }
  }

  private async generateParallelSectionsProfile(
    normalizedInput: LangchainAuditInput,
    locale: AuditLocale,
    options: LangchainAuditGenerateOptions,
  ): Promise<LangchainAuditOutput> {
    const budget = DeadlineBudget.fromNow(this.config.llmGlobalTimeoutMs);
    const summaryPayload = buildLlmPayload(normalizedInput, 'summary');
    const sectionPayloads = buildLlmSectionPayloads(normalizedInput);
    const sectionPayloadBytes = {
      executiveSection: payloadBytesUtil(sectionPayloads.executiveSection),
      prioritySection: payloadBytesUtil(sectionPayloads.prioritySection),
      executionSection: payloadBytesUtil(sectionPayloads.executionSection),
      clientCommsSection: payloadBytesUtil(sectionPayloads.clientCommsSection),
    };
    this.logger.log(
      `LLM profile=parallel_sections_v1 model=${this.config.llmModel} globalTimeoutMs=${this.config.llmGlobalTimeoutMs} sectionTimeoutMs=${this.config.llmSectionTimeoutMs} payloadBytes(summary=${payloadBytesUtil(summaryPayload)},executive=${sectionPayloadBytes.executiveSection},priority=${sectionPayloadBytes.prioritySection},execution=${sectionPayloadBytes.executionSection},clientComms=${sectionPayloadBytes.clientCommsSection})`,
    );

    const summaryLlm = this.createLlm(this.config.llmSummaryTimeoutMs);
    const sectionLlm = this.createLlm(this.config.llmSectionTimeoutMs);

    const [summaryResult, sectionResult] = await Promise.all([
      this.generateSummaryWithDeadline(
        summaryLlm,
        summaryPayload,
        locale,
        normalizedInput,
        budget,
        options,
      ),
      this.generateFanoutSectionsWithDeadline(
        sectionLlm,
        sectionPayloads,
        locale,
        normalizedInput,
        budget,
        options,
      ),
    ]);

    const warnings = [...summaryResult.warnings, ...sectionResult.warnings];
    const enrichedReport = ensurePriorityDepth(
      sectionResult.report,
      normalizedInput,
      locale,
    );
    const gate = this.runQualityGate(
      summaryResult.summaryText,
      enrichedReport,
      normalizedInput,
    );
    const adminReport = withDeterministicCost(gate.report, locale, {
      rateCurrency: this.config.rateCurrency,
      rateHourlyMin: this.config.rateHourlyMin,
      rateHourlyMax: this.config.rateHourlyMax,
    });
    adminReport.qualityGate = {
      valid: gate.valid,
      reasons: gate.reasons,
      retried: sectionResult.retryCount > 0,
      fallback: sectionResult.usedFallback,
    };
    adminReport.llmMeta = {
      profile: 'parallel_sections_v1',
      promptVersion: PROMPT_VERSION,
      deadlineMs: this.config.llmGlobalTimeoutMs,
      elapsedMs: budget.elapsedMs(),
      retryCount: sectionResult.retryCount,
      failedSections: sectionResult.failedSections,
      sectionPayloadBytes,
    };

    this.applyWarningsToReport(adminReport, warnings, locale);

    if (!gate.valid) {
      adminReport.qualityWarning = localizedText(
        locale,
        'Sortie normalisee apres echec du quality gate.',
        'Output normalized after quality gate failure.',
      );
    }

    return {
      summaryText: gate.summaryText,
      adminReport,
      expertSynthesis: buildExpertSynthesis(
        gate.summaryText,
        adminReport,
        normalizedInput,
      ),
    };
  }

  private async generateSummaryWithDeadline(
    summaryLlm: ChatOpenAI,
    summaryPayload: Record<string, unknown>,
    locale: AuditLocale,
    input: LangchainAuditInput,
    budget: DeadlineBudget,
    options: LangchainAuditGenerateOptions,
  ): Promise<{
    summaryText: string;
    warnings: Array<{ type: 'summary' | 'expert'; message: string }>;
  }> {
    const start = Date.now();
    await this.emitProgress(options, {
      section: 'summary',
      sectionStatus: 'started',
      iaSubTask: 'summary_generation',
    });
    try {
      const summaryText = await this.runLlmCallWithDeadline(
        'summary',
        this.config.llmSummaryTimeoutMs,
        budget,
        (signal) =>
          this.generateUserSummary(
            summaryLlm,
            summaryPayload,
            locale,
            false,
            signal,
          ),
      );
      this.logger.log(`LLM summary completed in ${Date.now() - start}ms.`);
      await this.emitProgress(options, {
        section: 'summary',
        sectionStatus: 'completed',
        iaSubTask: 'summary_generation',
      });
      return { summaryText, warnings: [] };
    } catch (error) {
      const reason = String(error);
      this.logger.warn(
        `LLM summary failed after ${Date.now() - start}ms: ${reason}`,
      );
      await this.emitProgress(options, {
        section: 'summary',
        sectionStatus: 'fallback',
        iaSubTask: 'summary_fallback',
      });
      return {
        summaryText: buildFallbackSummary(input),
        warnings: [{ type: 'summary', message: reason }],
      };
    }
  }

  private async generateFanoutSectionsWithDeadline(
    llm: ChatOpenAI,
    payloads: {
      executiveSection: Record<string, unknown>;
      prioritySection: Record<string, unknown>;
      executionSection: Record<string, unknown>;
      clientCommsSection: Record<string, unknown>;
    },
    locale: AuditLocale,
    input: LangchainAuditInput,
    budget: DeadlineBudget,
    options: LangchainAuditGenerateOptions,
  ): Promise<{
    report: ExpertReport;
    failedSections: FanoutSectionName[];
    retryCount: number;
    usedFallback: boolean;
    warnings: Array<{ type: 'summary' | 'expert'; message: string }>;
  }> {
    const resolved = new Map<
      FanoutSectionName,
      ExecutiveSection | PrioritySection | ExecutionSection | ClientCommsSection
    >();
    const errors = new Map<FanoutSectionName, string>();
    const warnings: Array<{ type: 'summary' | 'expert'; message: string }> = [];

    let retryCount = 0;
    let pending: FanoutSectionName[] = [
      'executiveSection',
      'prioritySection',
      'executionSection',
      'clientCommsSection',
    ];

    while (pending.length > 0) {
      const retryMode = retryCount > 0;
      const settled = await Promise.allSettled(
        pending.map((name) =>
          this.generateSectionOnce(
            llm,
            name,
            payloads[name],
            locale,
            retryMode,
            budget,
            options,
          ),
        ),
      );

      const failedRound: FanoutSectionName[] = [];
      for (let i = 0; i < settled.length; i += 1) {
        const section = pending[i];
        const result = settled[i];
        if (result.status === 'fulfilled') {
          resolved.set(section, result.value);
          errors.delete(section);
          continue;
        }
        const reason = String(result.reason);
        errors.set(section, reason);
        failedRound.push(section);
      }

      if (failedRound.length === 0) break;

      const canRetry =
        retryCount < this.config.llmSectionRetryMax &&
        budget.hasTime(this.config.llmSectionRetryMinRemainingMs);
      if (!canRetry) {
        pending = failedRound;
        break;
      }
      retryCount += 1;
      pending = failedRound;
    }

    for (const [section, reason] of errors.entries()) {
      warnings.push({
        type: 'expert',
        message: `${section} failed: ${reason}`,
      });
      await this.emitProgress(options, {
        section,
        sectionStatus: 'fallback',
        iaSubTask: 'section_fallback',
      });
    }

    const fallbackReport = buildFallbackExpertReport(
      input,
      errors.size
        ? `fanout_missing_sections:${Array.from(errors.keys()).join(',')}`
        : 'fanout_ok',
    );
    const report = this.mergeFanoutSections(
      fallbackReport,
      resolved.get('executiveSection') as ExecutiveSection | undefined,
      resolved.get('prioritySection') as PrioritySection | undefined,
      resolved.get('executionSection') as ExecutionSection | undefined,
      resolved.get('clientCommsSection') as ClientCommsSection | undefined,
    );

    return {
      report,
      failedSections: Array.from(errors.keys()),
      retryCount,
      usedFallback: errors.size > 0,
      warnings,
    };
  }

  private mergeFanoutSections(
    fallbackReport: ExpertReport,
    executiveSection?: ExecutiveSection,
    prioritySection?: PrioritySection,
    executionSection?: ExecutionSection,
    clientCommsSection?: ClientCommsSection,
  ): ExpertReport {
    const diagnosticChapters = {
      ...fallbackReport.diagnosticChapters,
      ...(executiveSection
        ? {
            scorecardAndBusinessOpportunities:
              executiveSection.scorecardAndBusinessOpportunities,
          }
        : {}),
      ...(prioritySection
        ? {
            seoFoundations: prioritySection.seoFoundations,
          }
        : {}),
      ...(executionSection
        ? {
            conversionAndClarity: executionSection.conversionAndClarity,
            speedAndPerformance: executionSection.speedAndPerformance,
            credibilityAndTrust: executionSection.credibilityAndTrust,
            techAndScalability: executionSection.techAndScalability,
          }
        : {}),
    };

    return {
      ...fallbackReport,
      diagnosticChapters,
      ...(executiveSection
        ? {
            executiveSummary: executiveSection.executiveSummary,
            reportExplanation: executiveSection.reportExplanation,
            strengths: executiveSection.strengths,
          }
        : {}),
      ...(prioritySection
        ? {
            priorities: prioritySection.priorities,
            urlLevelImprovements: prioritySection.urlLevelImprovements,
          }
        : {}),
      ...(executionSection
        ? {
            implementationTodo: executionSection.implementationTodo,
            whatToFixThisWeek: executionSection.whatToFixThisWeek,
            whatToFixThisMonth: executionSection.whatToFixThisMonth,
            fastImplementationPlan: executionSection.fastImplementationPlan,
            implementationBacklog: executionSection.implementationBacklog,
            invoiceScope: executionSection.invoiceScope,
            techFingerprint: executionSection.techFingerprint,
            perPageAnalysis:
              executionSection.perPageAnalysis ??
              fallbackReport.perPageAnalysis,
            internalNotes:
              executionSection.internalNotes ?? fallbackReport.internalNotes,
          }
        : {}),
      ...(clientCommsSection
        ? {
            clientMessageTemplate: clientCommsSection.clientMessageTemplate,
            clientLongEmail: clientCommsSection.clientLongEmail,
            clientEmailDraft:
              clientCommsSection.clientEmailDraft ??
              fallbackReport.clientEmailDraft,
          }
        : {}),
    };
  }

  private async generateSectionOnce(
    llm: ChatOpenAI,
    section: FanoutSectionName,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode: boolean,
    budget: DeadlineBudget,
    options: LangchainAuditGenerateOptions,
  ): Promise<
    ExecutiveSection | PrioritySection | ExecutionSection | ClientCommsSection
  > {
    const start = Date.now();
    const payloadBytes = payloadBytesUtil(payload);
    let succeeded = false;
    this.logger.log(
      `LLM ${section} attempt=${retryMode ? 2 : 1} payloadBytes=${payloadBytes} remainingBudgetMs=${budget.remainingMs()}`,
    );
    await this.emitProgress(options, {
      section,
      sectionStatus: 'started',
      iaSubTask: `${section}_${retryMode ? 'retry' : 'start'}`,
    });

    try {
      switch (section) {
        case 'executiveSection': {
          const result = await this.runLlmCallWithDeadline(
            section,
            this.config.llmSectionTimeoutMs,
            budget,
            (signal) =>
              this.generateExecutiveSection(
                llm,
                payload,
                locale,
                retryMode,
                signal,
              ),
          );
          succeeded = true;
          await this.emitProgress(options, {
            section,
            sectionStatus: 'completed',
            iaSubTask: section,
          });
          return result;
        }
        case 'prioritySection': {
          const result = await this.runLlmCallWithDeadline(
            section,
            this.config.llmSectionTimeoutMs,
            budget,
            (signal) =>
              this.generatePrioritySection(
                llm,
                payload,
                locale,
                retryMode,
                signal,
              ),
          );
          succeeded = true;
          await this.emitProgress(options, {
            section,
            sectionStatus: 'completed',
            iaSubTask: section,
          });
          return result;
        }
        case 'executionSection': {
          const result = await this.runLlmCallWithDeadline(
            section,
            this.config.llmSectionTimeoutMs,
            budget,
            (signal) =>
              this.generateExecutionSection(
                llm,
                payload,
                locale,
                retryMode,
                signal,
              ),
          );
          succeeded = true;
          await this.emitProgress(options, {
            section,
            sectionStatus: 'completed',
            iaSubTask: section,
          });
          return result;
        }
        case 'clientCommsSection': {
          const result = await this.runLlmCallWithDeadline(
            section,
            this.config.llmSectionTimeoutMs,
            budget,
            (signal) =>
              this.generateClientCommsSection(
                llm,
                payload,
                locale,
                retryMode,
                signal,
              ),
          );
          succeeded = true;
          await this.emitProgress(options, {
            section,
            sectionStatus: 'completed',
            iaSubTask: section,
          });
          return result;
        }
      }
      throw new Error(`Unsupported fanout section: ${section as string}`);
    } catch (error) {
      this.logger.warn(`LLM ${section} failed: ${String(error)}`);
      await this.emitProgress(options, {
        section,
        sectionStatus: 'failed',
        iaSubTask: section,
      });
      throw error;
    } finally {
      const durationMs = Date.now() - start;
      this.logger.log(
        `LLM ${section} ${succeeded ? 'completed' : 'stopped'} in ${durationMs}ms.`,
      );
    }
  }

  private async generateExecutiveSection(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode: boolean,
    signal?: AbortSignal,
  ): Promise<ExecutiveSection> {
    const chain = llm.withStructuredOutput(executiveSectionSchema);
    return this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: executiveSystemMain(locale),
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: executiveRetryConstraint(locale),
              },
            ]
          : []),
        { role: 'user', content: wrapUntrustedUserPayload(payload) },
      ],
      'executive',
      locale,
      signal,
    );
  }

  private async generatePrioritySection(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode: boolean,
    signal?: AbortSignal,
  ): Promise<PrioritySection> {
    const chain = llm.withStructuredOutput(prioritySectionSchema);
    return this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: prioritySystemMain(locale),
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: priorityRetryConstraint(locale),
              },
            ]
          : []),
        { role: 'user', content: wrapUntrustedUserPayload(payload) },
      ],
      'priority',
      locale,
      signal,
    );
  }

  private async generateExecutionSection(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode: boolean,
    signal?: AbortSignal,
  ): Promise<ExecutionSection> {
    const chain = llm.withStructuredOutput(executionSectionSchema);
    return this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: executionSystemMain(locale),
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: executionRetryConstraint(locale),
              },
            ]
          : []),
        { role: 'user', content: wrapUntrustedUserPayload(payload) },
      ],
      'execution',
      locale,
      signal,
    );
  }

  private async generateClientCommsSection(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode: boolean,
    signal?: AbortSignal,
  ): Promise<ClientCommsSection> {
    const chain = llm.withStructuredOutput(clientCommsSectionSchema);
    return this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: clientCommsSystemMain(locale),
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: clientCommsRetryConstraint(locale),
              },
            ]
          : []),
        { role: 'user', content: wrapUntrustedUserPayload(payload) },
      ],
      'client_comms',
      locale,
      signal,
    );
  }

  private async runLlmCallWithDeadline<T>(
    label: string,
    timeoutMs: number,
    budget: DeadlineBudget,
    run: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    return this.llmExecutor.execute(() =>
      withHardTimeout(`llm:${label}`, timeoutMs, run, budget),
    );
  }

  private async generateUserSummary(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode = false,
    signal?: AbortSignal,
  ): Promise<string> {
    const chain = llm.withStructuredOutput(userSummarySchema);
    const result = await this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: userSummarySystemMain(locale),
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: userSummaryRetryConstraint(locale),
              },
            ]
          : []),
        {
          role: 'user',
          content: wrapUntrustedUserPayload(payload),
        },
      ],
      'user_summary',
      locale,
      signal,
    );

    return result.summaryText;
  }

  private async generateExpertReport(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode = false,
    compactMode = false,
    signal?: AbortSignal,
  ): Promise<ExpertReport> {
    const chain = llm.withStructuredOutput(expertReportSchema);
    return this.invokeTracked(
      chain,
      [
        {
          role: 'system' as const,
          content:
            locale === 'fr'
              ? UNTRUSTED_DATA_DISCLAIMER_FR
              : UNTRUSTED_DATA_DISCLAIMER_EN,
        },
        {
          role: 'system',
          content: expertReportSystemMain(locale),
        },
        {
          role: 'system',
          content: expertReportStrictConstraint(locale),
        },
        ...(compactMode
          ? [
              {
                role: 'system' as const,
                content: expertReportCompactConstraint(locale),
              },
            ]
          : []),
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content: expertReportRetryConstraint(locale),
              },
            ]
          : []),
        {
          role: 'user',
          content: wrapUntrustedUserPayload(payload),
        },
      ],
      'expert_report',
      locale,
      signal,
    );
  }

  private fallback(
    input: LangchainAuditInput,
    reason: string,
    _options?: LangchainAuditGenerateOptions,
  ): LangchainAuditOutput {
    void _options;
    const gate = this.runQualityGate(
      buildFallbackSummary(input),
      ensurePriorityDepth(
        buildFallbackExpertReport(input, reason),
        input,
        input.locale,
      ),
      input,
    );

    const adminReport = withDeterministicCost(gate.report, input.locale, {
      rateCurrency: this.config.rateCurrency,
      rateHourlyMin: this.config.rateHourlyMin,
      rateHourlyMax: this.config.rateHourlyMax,
    });
    adminReport.qualityGate = {
      valid: gate.valid,
      reasons: gate.reasons,
      retried: false,
      fallback: true,
    };

    return {
      summaryText: gate.summaryText,
      adminReport,
      expertSynthesis: buildExpertSynthesis(
        gate.summaryText,
        adminReport,
        input,
      ),
    };
  }

  private async generateCandidate(
    summaryLlm: ChatOpenAI,
    expertLlm: ChatOpenAI,
    summaryPayload: Record<string, unknown>,
    expertCompactPayload: Record<string, unknown>,
    input: LangchainAuditInput,
    locale: AuditLocale,
    retryMode: boolean,
  ): Promise<{
    summaryText: string;
    report: ExpertReport;
    expertSource: 'compact' | 'full' | 'fallback';
    usedSummaryFallback: boolean;
    usedExpertFallback: boolean;
    warnings: Array<{ type: 'summary' | 'expert'; message: string }>;
  }> {
    const warnings: Array<{ type: 'summary' | 'expert'; message: string }> = [];
    let usedSummaryFallback = false;
    let summaryText = '';
    const summaryStart = Date.now();
    try {
      summaryText = await this.generateUserSummary(
        summaryLlm,
        summaryPayload,
        locale,
        retryMode,
      );
      const durationMs = Date.now() - summaryStart;
      this.logger.log(`LLM summary completed in ${durationMs}ms.`);
    } catch (error) {
      const durationMs = Date.now() - summaryStart;
      usedSummaryFallback = true;
      summaryText = buildFallbackSummary(input);
      warnings.push({
        type: 'summary',
        message: String(error),
      });
      this.logger.warn(
        `LLM summary failed after ${durationMs}ms: ${String(error)}`,
      );
    }

    const expertStart = Date.now();
    try {
      const report = await this.generateExpertReport(
        expertLlm,
        expertCompactPayload,
        locale,
        true,
        true,
      );
      const durationMs = Date.now() - expertStart;
      this.logger.log(`LLM expert compact completed in ${durationMs}ms.`);
      return {
        summaryText,
        report,
        expertSource: 'compact',
        usedSummaryFallback,
        usedExpertFallback: false,
        warnings,
      };
    } catch (error) {
      const durationMs = Date.now() - expertStart;
      const reason = String(error);
      warnings.push({
        type: 'expert',
        message: isTimeoutError(error)
          ? `compact expert timeout: ${reason}`
          : `compact expert failed: ${reason}`,
      });
      this.logger.warn(
        `LLM expert compact failed after ${durationMs}ms: ${reason}`,
      );

      return {
        summaryText,
        report: buildFallbackExpertReport(input, reason),
        expertSource: 'fallback',
        usedSummaryFallback,
        usedExpertFallback: true,
        warnings,
      };
    }
  }

  private runQualityGate(
    summaryText: string,
    report: ExpertReport,
    input: LangchainAuditInput,
  ): ReportQualityGateResult {
    const context: ReportQualityGateContext = {
      locale: input.locale,
      websiteName: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      quickWins: input.quickWins,
      pillarScores: input.pillarScores,
      deepFindings: input.deepFindings,
    };
    return this.qualityGate.apply(summaryText, report, context);
  }

  private buildFallbackExpertReport(
    input: LangchainAuditInput,
    reason: string,
  ): ExpertReport {
    return buildFallbackExpertReport(input, reason);
  }

  /** Delegue a llm-payload.builder (conserve pour compatibilite interne/test). */
  private buildSectionPayloads(input: LangchainAuditInput): {
    executiveSection: Record<string, unknown>;
    prioritySection: Record<string, unknown>;
    executionSection: Record<string, unknown>;
    clientCommsSection: Record<string, unknown>;
  } {
    return buildLlmSectionPayloads(input);
  }

  private applyWarningsToReport(
    adminReport: Record<string, unknown>,
    warnings: Array<{ type: 'summary' | 'expert'; message: string }>,
    locale: AuditLocale,
  ): void {
    for (const warning of warnings) {
      if (warning.type === 'summary') {
        this.logger.warn(`LLM user summary failed: ${warning.message}`);
        adminReport.summaryWarning = localizedText(
          locale,
          'Resume utilisateur LLM indisponible. Resume deterministe utilise.',
          'LLM user summary failed. Deterministic summary used.',
        );
      } else {
        this.logger.warn(`LLM expert report failed: ${warning.message}`);
      }
    }
  }

  private async emitProgress(
    options: LangchainAuditGenerateOptions,
    event: LlmSynthesisProgressEvent,
  ): Promise<void> {
    if (!options.onProgress) return;
    try {
      await options.onProgress(event);
    } catch (error) {
      this.logger.warn(`LLM progress callback failed: ${String(error)}`);
    }
  }

  private createLlm(timeoutMs: number): ChatOpenAI {
    return this.chatOpenAIFactory.create(timeoutMs);
  }
}
