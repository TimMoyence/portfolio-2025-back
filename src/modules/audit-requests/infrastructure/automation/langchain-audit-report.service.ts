import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type {
  ExpertReportSynthesis,
  PerPageDetailedAnalysis,
} from '../../domain/AuditReportTiers';
import {
  AuditLocale,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig, AuditLlmProfile } from './audit.config';
import {
  buildFallbackExpertReport,
  buildFallbackSummary,
  ensurePriorityDepth,
  withDeterministicCost,
} from './langchain-fallback-report.builder';
import {
  DeadlineBudget,
  LlmInFlightLimiter,
  getSharedLlmInFlightLimiter,
  withHardTimeout,
} from './llm-execution.guardrails';
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

type SynthesisSectionName = 'summary' | FanoutSectionName;
type SynthesisSectionStatus = 'started' | 'completed' | 'failed' | 'fallback';

export interface LlmSynthesisProgressEvent {
  section: SynthesisSectionName;
  sectionStatus: SynthesisSectionStatus;
  iaSubTask: string;
}

export interface LangchainAuditGenerateOptions {
  onProgress?: (progress: LlmSynthesisProgressEvent) => void | Promise<void>;
}

export interface LangchainAuditInput {
  auditId?: string;
  locale: AuditLocale;
  websiteName: string;
  normalizedUrl: string;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: Record<string, number>;
  deepFindings: Array<{
    code: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    confidence: number;
    impact: 'traffic' | 'indexation' | 'conversion';
    affectedUrls: string[];
    recommendation: string;
  }>;
  sampledUrls: Array<{
    url: string;
    statusCode: number | null;
    indexable: boolean;
    canonical: string | null;
    title?: string | null;
    metaDescription?: string | null;
    h1Count?: number;
    htmlLang?: string | null;
    canonicalCount?: number;
    responseTimeMs?: number | null;
    server?: string | null;
    xPoweredBy?: string | null;
    setCookiePatterns?: string[];
    cacheHeaders?: Record<string, string>;
    securityHeaders?: Record<string, string>;
    error: string | null;
  }>;
  pageRecaps: Array<{
    url: string;
    priority: 'high' | 'medium' | 'low';
    wordingScore: number;
    trustScore: number;
    ctaScore: number;
    seoCopyScore: number;
    topIssues: string[];
    recommendations: string[];
    source: 'llm' | 'fallback';
    /**
     * Optionnel en Phase 5 pour compatibilite ascendante : si present,
     * passe directement dans les payloads LLM et dans le fallback pour
     * construire `perPageAnalysis`.
     */
    engineScores?: {
      google: {
        engine: 'google';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      bingChatGpt: {
        engine: 'bing_chatgpt';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      perplexity: {
        engine: 'perplexity';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
      geminiOverviews: {
        engine: 'gemini_overviews';
        score: number;
        indexable: boolean;
        strengths: string[];
        blockers: string[];
        opportunities: string[];
      };
    };
    title?: string | null;
  }>;
  pageSummary: Record<string, unknown>;
  techFingerprint: {
    primaryStack: string;
    confidence: number;
    evidence: string[];
    alternatives: string[];
    unknowns: string[];
  };
}

export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
  /**
   * Projection typee `ExpertReportSynthesis` destinee au Tier Expert
   * (rapport technique a Tim). Contient perPageAnalysis, cross-findings,
   * priority backlog, clientEmailDraft et internalNotes.
   */
  expertSynthesis: ExpertReportSynthesis;
}

@Injectable()
export class LangchainAuditReportService {
  private readonly logger = new Logger(LangchainAuditReportService.name);
  private readonly llmLimiter: LlmInFlightLimiter;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly qualityGate: ReportQualityGateService,
  ) {
    this.llmLimiter = getSharedLlmInFlightLimiter(this.config.llmInflightMax);
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

    const profile = this.resolveProfile(normalizedInput.auditId);
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
        payloadBytes: {
          summary: summaryPayloadBytes,
          expert: expertPayloadBytes,
          expertCompact: expertCompactPayloadBytes,
        },
      };

      return {
        summaryText: gate.summaryText,
        adminReport,
        expertSynthesis: this.buildExpertSynthesis(
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
      expertSynthesis: this.buildExpertSynthesis(
        gate.summaryText,
        adminReport,
        normalizedInput,
      ),
    };
  }

  private resolveProfile(auditId?: string): AuditLlmProfile {
    const configured = this.config.llmProfile;
    if (configured !== 'parallel_sections_v1') {
      return 'stability_first_sequential';
    }

    const canaryPercent = this.config.llmProfileCanaryPercent;
    if (canaryPercent >= 100) return 'parallel_sections_v1';
    if (canaryPercent <= 0) return 'stability_first_sequential';
    if (!auditId) return 'parallel_sections_v1';

    const bucket = this.hashToPercent(auditId);
    return bucket < canaryPercent
      ? 'parallel_sections_v1'
      : 'stability_first_sequential';
  }

  private hashToPercent(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
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
    return chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu es principal consultant SEO/produit. Reponds uniquement en francais. Produis un rapport complet pour decideur: executiveSummary, reportExplanation, strengths et scorecardAndBusinessOpportunities. Obligation anti-hallucination: chaque affirmation doit provenir des donnees recues (evidenceBuckets.crawl, evidenceBuckets.findings, evidenceBuckets.pageRecaps, evidenceBuckets.techFingerprint). Si un point est incertain, ecris 'Non verifiable'."
              : "You are a principal SEO/product consultant. Respond only in English. Produce decision-grade output: executiveSummary, reportExplanation, strengths, and scorecardAndBusinessOpportunities. Anti-hallucination rule: every major claim must map to provided evidence buckets (crawl/findings/pageRecaps/techFingerprint). If uncertain, write 'Not verifiable'.",
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte retry: aucun champ vide, aucune repetition, format dense et orienté business.'
                    : 'Retry constraint: no empty fields, no repetition, dense business-first format.',
              },
            ]
          : []),
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { signal },
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
    return chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu produis uniquement les priorites et ameliorations URL + seoFoundations. Reponds en francais uniquement. Donne 8-10 priorites uniques avec severite, whyItMatters, recommendedFix et effort, puis des ameliorations URL concretes. Chaque item doit citer implicitement une preuve des buckets (crawl/findings/pageRecaps). Si la preuve n'existe pas: Non verifiable."
              : 'Return only priorities, URL-level improvements, and seoFoundations. English only. Produce 8-10 unique priorities with severity, whyItMatters, recommendedFix, and effort, then concrete URL-level actions. Every item must be evidence-linked to buckets (crawl/findings/pageRecaps). If unsupported: Not verifiable.',
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte retry: minimum 8 priorites valides, pas de genericite, pas de doublon.'
                    : 'Retry constraint: minimum 8 valid priorities, no generic filler, no duplicates.',
              },
            ]
          : []),
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { signal },
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
    return chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu produis uniquement la partie execution avancee: implementationTodo, whatToFixThisWeek, whatToFixThisMonth, fastImplementationPlan, implementationBacklog, invoiceScope, conversionAndClarity, speedAndPerformance, credibilityAndTrust, techAndScalability, techFingerprint, perPageAnalysis et internalNotes. Reponds en francais uniquement. Chaque chapitre doit etre detaille, bien ecrit, exploitable et relie a des preuves. Mentionne CMS/framework/runtime principal avec confiance et evidences. Pour perPageAnalysis: une entree par URL analysee (max 10) avec url, title, engineScores (4 moteurs: google, bingChatGpt, perplexity, geminiOverviews chacun avec score, indexable, strengths/blockers/opportunities), topIssues, recommendations et evidence. Pour internalNotes: notes internes pour Tim avant l'appel client, ton franc et direct, en 5-10 lignes maxi (risques, leviers, points a preparer)."
              : 'Return only advanced execution outputs: implementationTodo, whatToFixThisWeek, whatToFixThisMonth, fastImplementationPlan, implementationBacklog, invoiceScope, conversionAndClarity, speedAndPerformance, credibilityAndTrust, techAndScalability, techFingerprint, perPageAnalysis, and internalNotes. English only. Chapters must be implementation-ready and evidence-linked. State one primary CMS/framework/runtime guess with confidence and evidence. For perPageAnalysis: one entry per analyzed URL (max 10) with url, title, engineScores (4 engines: google, bingChatGpt, perplexity, geminiOverviews, each with score, indexable, strengths/blockers/opportunities), topIssues, recommendations, and evidence. For internalNotes: internal notes for Tim before the client call, direct tone, 5-10 lines max (risks, levers, points to prepare).',
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte retry: prioriser impact business + SEO, limiter verbiage, conserver details techniques.'
                    : 'Retry constraint: prioritize business + SEO impact, trim fluff, keep technical details.',
              },
            ]
          : []),
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { signal },
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
    return chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu produis uniquement clientMessageTemplate, clientLongEmail et clientEmailDraft. Francais uniquement. clientMessageTemplate doit etre un rapport engageant donnant envie de continuer et d'avoir plus d'informations. clientLongEmail doit rester professionnel, actionnable et coherent avec les priorites techniques sans inventer de donnees. Pour clientEmailDraft: email pret a envoyer, ton mix court et long, accrocheur sur les constats, teaser PDF, CTA vers un appel. Structure: subject 50-70 caracteres accrocheur, body compose de 4 paragraphes (P1 ouverture + constat #1 en 3 lignes, P2 constat #2 avec impact business chiffre si possible en 3 lignes, P3 teaser PDF en 2 lignes 'votre rapport complet attache contient...', P4 CTA planifier un appel de 30 min), signature 'Tim / Asili Design'."
              : "Return only clientMessageTemplate, clientLongEmail, and clientEmailDraft. English only. clientMessageTemplate must be short (3-5 lines). clientLongEmail must stay professional, actionable, and aligned with technical priorities without inventing facts. For clientEmailDraft: ready-to-send email, mix short and long tone, catchy on findings, PDF teaser, CTA to a call. Structure: subject 50-70 chars catchy, body with 4 paragraphs (P1 personalized opener + finding #1 in 3 lines, P2 finding #2 with quantified business impact if possible in 3 lines, P3 PDF teaser in 2 lines 'your full report attached contains...', P4 CTA to schedule a 30-minute call), signature 'Tim / Asili Design'.",
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte retry: ton humain, aucune repetition, aucun jargon inutile.'
                    : 'Retry constraint: human tone, no repetition, no unnecessary jargon.',
              },
            ]
          : []),
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { signal },
    );
  }

  private async runLlmCallWithDeadline<T>(
    label: string,
    timeoutMs: number,
    budget: DeadlineBudget,
    run: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    return this.llmLimiter.run(() =>
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
    const result = await chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu rediges un resume client utile pour un decideur non technique. Reponds uniquement en francais. Interdiction stricte: pas de markdown ni HTML (aucun *, **, #, -, bullet, backtick). Format impose en 4 sections en texte brut: Contexte:, Blocages:, Impacts business:, Priorites immediates:. N'invente aucune donnee. Si une information manque, ecris 'Non verifiable'. Il faut que le resumé soit engageant et donne envie d'avoir plus de details dans le rapport technique."
              : "Write a short, useful client summary for a non-technical stakeholder. English only. Strictly forbid markdown/HTML (no *, **, #, -, bullets, backticks). Required plain-text 4-section format: Context:, Blockers:, Business impact:, Immediate priorities:. Max 950 characters. Never invent data; if unknown write 'Not verifiable'.",
        },
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte supplementaire: sections non vides, langage unique, liste numerotee 1) 2) 3) 4) dans Priorites immediates.'
                    : 'Additional rule: non-empty sections, single language, numbered list 1) 2) 3) 4) inside Immediate priorities.',
              },
            ]
          : []),
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
      { signal },
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
    return chain.invoke(
      [
        {
          role: 'system',
          content:
            locale === 'fr'
              ? "Tu es un expert SEO technique, engineering web senior et PM delivery. Reponds uniquement en francais, ton technique et orienté execution. Fournis un rapport operationnel complet avec causes racines, remediation precise, dependances, criteres d'acceptation, priorisation impact/effort, et chapitres diagnostiques longs: conversionAndClarity, speedAndPerformance, seoFoundations, credibilityAndTrust, techAndScalability, scorecardAndBusinessOpportunities, plus techFingerprint (primaryStack, confidence, evidence, alternatives, unknowns). Tu produis aussi perPageAnalysis (une entree par URL avec engineScores 4 moteurs + topIssues + recommendations + evidence), clientEmailDraft (subject accrocheur 50-70 chars + body 4 paragraphes mixant court/long accrocheur teaser PDF CTA appel) et internalNotes (notes internes pour Tim, 5-10 lignes, ton direct). Utilise uniquement les donnees disponibles. Si non prouvable: Non verifiable."
              : 'You are a senior technical SEO, web engineering, and delivery PM expert. Respond only in English with an execution-first tone. Produce a complete implementation report with root causes, concrete remediations, dependencies, acceptance criteria, impact/effort prioritization, and long diagnostic chapters: conversionAndClarity, speedAndPerformance, seoFoundations, credibilityAndTrust, techAndScalability, scorecardAndBusinessOpportunities, plus techFingerprint (primaryStack, confidence, evidence, alternatives, unknowns). Also produce perPageAnalysis (one entry per URL with engineScores 4 engines + topIssues + recommendations + evidence), clientEmailDraft (catchy subject 50-70 chars + 4-paragraph body mixing short/long, catchy, PDF teaser, call CTA), and internalNotes (internal notes for Tim, 5-10 lines, direct tone). Use only provided data. If not provable, write Not verifiable.',
        },
        {
          role: 'system',
          content:
            locale === 'fr'
              ? 'Contrainte stricte: claims evidence-first, pas de speculation, pas de langue mixte. Limites visees: urlLevelImprovements max 8, implementationTodo max 8, whatToFixThisWeek max 5, whatToFixThisMonth max 6, fastImplementationPlan max 5, implementationBacklog max 10, invoiceScope max 10, perPageAnalysis max 10.'
              : 'Strict constraint: evidence-first claims, no speculation, no mixed language. Target limits: urlLevelImprovements up to 8, implementationTodo up to 8, whatToFixThisWeek up to 5, whatToFixThisMonth up to 6, fastImplementationPlan up to 5, implementationBacklog up to 10, invoiceScope up to 10, perPageAnalysis up to 10.',
        },
        ...(compactMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Mode compact: privilegie les actions a plus fort impact et reduis les details non essentiels.'
                    : 'Compact mode: prioritize highest-impact actions and trim non-essential details.',
              },
            ]
          : []),
        ...(retryMode
          ? [
              {
                role: 'system' as const,
                content:
                  locale === 'fr'
                    ? 'Contrainte stricte supplementaire: minimum 8 priorites uniques, champs non vides, aucune duplication, et langue unique.'
                    : 'Additional strict rule: minimum 8 unique priorities, non-empty fields, no duplicates, and single-language output.',
              },
            ]
          : []),
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
      { signal },
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
      expertSynthesis: this.buildExpertSynthesis(
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
    return new ChatOpenAI({
      apiKey: this.config.openAiApiKey,
      model: this.config.llmModel,
      timeout: timeoutMs,
      maxRetries: 0,
      temperature: 0.2,
    });
  }

  /**
   * Projette un rapport admin enrichi vers le type domaine
   * `ExpertReportSynthesis` (Tier Expert). Construit
   * `perPageAnalysis`, `crossPageFindings`, `priorityBacklog`,
   * `clientEmailDraft` et `internalNotes` en garantissant des defauts
   * deterministes si le LLM a omis certains champs.
   */
  private buildExpertSynthesis(
    summaryText: string,
    adminReport: Record<string, unknown>,
    input: LangchainAuditInput,
  ): ExpertReportSynthesis {
    const executiveSummary =
      typeof adminReport.executiveSummary === 'string' &&
      adminReport.executiveSummary.trim().length > 0
        ? adminReport.executiveSummary
        : summaryText;

    const perPageAnalysis = this.projectPerPageAnalysis(
      adminReport.perPageAnalysis,
    );

    const crossPageFindings = input.deepFindings.map((finding) => ({
      title: finding.title,
      severity: finding.severity as 'critical' | 'high' | 'medium' | 'low',
      affectedUrls: [...finding.affectedUrls],
      rootCause: finding.description,
      remediation: finding.recommendation,
    }));

    const priorityBacklog = Array.isArray(adminReport.implementationBacklog)
      ? (adminReport.implementationBacklog as Array<Record<string, unknown>>)
          .slice(0, 12)
          .map((entry) => ({
            title: typeof entry.task === 'string' ? entry.task : '',
            impact: this.toImpact(entry.priority),
            effort: this.toEffort(entry.estimatedHours),
            acceptanceCriteria: Array.isArray(entry.acceptanceCriteria)
              ? (entry.acceptanceCriteria as string[]).map(String)
              : [],
          }))
          .filter((entry) => entry.title.length > 0)
      : [];

    const clientEmailDraft =
      this.normalizeClientEmailDraft(adminReport.clientEmailDraft) ??
      this.buildFallbackEmailDraft(input);

    const internalNotes =
      typeof adminReport.internalNotes === 'string' &&
      adminReport.internalNotes.trim().length > 0
        ? adminReport.internalNotes.trim()
        : this.buildFallbackNotes(input);

    return {
      executiveSummary,
      perPageAnalysis,
      crossPageFindings,
      priorityBacklog,
      clientEmailDraft,
      internalNotes,
    };
  }

  private projectPerPageAnalysis(
    raw: unknown,
  ): ReadonlyArray<PerPageDetailedAnalysis> {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry): PerPageDetailedAnalysis | null => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Record<string, unknown>;
        const url = typeof record.url === 'string' ? record.url : '';
        if (!url) return null;
        const engineScores = record.engineScores as
          | PerPageDetailedAnalysis['engineScores']
          | undefined;
        if (!engineScores) return null;
        return {
          url,
          title: typeof record.title === 'string' ? record.title : '',
          engineScores,
          topIssues: Array.isArray(record.topIssues)
            ? (record.topIssues as string[]).map(String).slice(0, 6)
            : [],
          recommendations: Array.isArray(record.recommendations)
            ? (record.recommendations as string[]).map(String).slice(0, 6)
            : [],
          evidence: Array.isArray(record.evidence)
            ? (record.evidence as string[]).map(String).slice(0, 6)
            : [],
        };
      })
      .filter((entry): entry is PerPageDetailedAnalysis => entry !== null);
  }

  private normalizeClientEmailDraft(
    raw: unknown,
  ): { subject: string; body: string } | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const subject = typeof record.subject === 'string' ? record.subject : '';
    const body = typeof record.body === 'string' ? record.body : '';
    if (!subject.trim() || !body.trim()) return null;
    return { subject: subject.trim(), body: body.trim() };
  }

  private buildFallbackEmailDraft(input: LangchainAuditInput): {
    subject: string;
    body: string;
  } {
    const subject =
      input.locale === 'en'
        ? `Audit findings for ${input.websiteName}`
        : `Audit ${input.websiteName} : vos priorites`;
    const body =
      input.locale === 'en'
        ? `Hello,\n\nThe audit of ${input.websiteName} is ready. I would love to walk you through it in 30 minutes.\n\nTim / Asili Design`
        : `Bonjour,\n\nL'audit de ${input.websiteName} est pret. J'aimerais vous le presenter en 30 minutes.\n\nTim / Asili Design`;
    return { subject, body };
  }

  private buildFallbackNotes(input: LangchainAuditInput): string {
    return input.locale === 'en'
      ? `Internal notes for ${input.websiteName}: review the priorities and prepare the 30-minute pitch.`
      : `Notes internes pour ${input.websiteName} : revue des priorites et preparation du pitch 30 minutes.`;
  }

  private toImpact(value: unknown): 'high' | 'medium' | 'low' {
    if (value === 'high') return 'high';
    if (value === 'low') return 'low';
    return 'medium';
  }

  private toEffort(value: unknown): 'high' | 'medium' | 'low' {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'medium';
    if (value >= 8) return 'high';
    if (value <= 3) return 'low';
    return 'medium';
  }
}
