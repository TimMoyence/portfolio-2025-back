import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  AuditLocale,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig, AuditLlmProfile } from './audit.config';
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

const expertReportSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
  diagnosticChapters: diagnosticChaptersSchema,
  techFingerprint: techFingerprintSchema,
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
});

const clientCommsSectionSchema = z.object({
  clientMessageTemplate: expertReportSchema.shape.clientMessageTemplate,
  clientLongEmail: expertReportSchema.shape.clientLongEmail,
});

type ExpertReport = z.infer<typeof expertReportSchema>;
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
}

type LlmPayloadProfile = 'summary' | 'expert' | 'expert_compact';

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
    const summaryPayload = this.buildPayload(normalizedInput, 'summary');
    const expertPayload = this.buildPayload(normalizedInput, 'expert');
    const expertCompactPayload = this.buildPayload(
      normalizedInput,
      'expert_compact',
    );

    const summaryPayloadBytes = this.payloadBytes(summaryPayload);
    const expertPayloadBytes = this.payloadBytes(expertPayload);
    const expertCompactPayloadBytes = this.payloadBytes(expertCompactPayload);
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
        this.ensurePriorityDepth(candidate.report, normalizedInput, locale),
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
            this.ensurePriorityDepth(fullExpert, normalizedInput, locale),
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

      const adminReport = this.withDeterministicCost(gate.report, locale);
      adminReport.qualityGate = {
        valid: gate.valid,
        reasons: gate.reasons,
        retried,
        fallback: candidate.usedExpertFallback,
      };

      for (const warning of candidate.warnings) {
        if (warning.type === 'summary') {
          this.logger.warn(`LLM user summary failed: ${warning.message}`);
          adminReport.summaryWarning = this.text(
            locale,
            'Resume utilisateur LLM indisponible. Resume deterministe utilise.',
            'LLM user summary failed. Deterministic summary used.',
          );
        } else {
          this.logger.warn(`LLM expert report failed: ${warning.message}`);
        }
      }

      if (!gate.valid) {
        adminReport.qualityWarning = this.text(
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

      return { summaryText: gate.summaryText, adminReport };
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
    const summaryPayload = this.buildPayload(normalizedInput, 'summary');
    const sectionPayloads = this.buildSectionPayloads(normalizedInput);
    const sectionPayloadBytes = {
      executiveSection: this.payloadBytes(sectionPayloads.executiveSection),
      prioritySection: this.payloadBytes(sectionPayloads.prioritySection),
      executionSection: this.payloadBytes(sectionPayloads.executionSection),
      clientCommsSection: this.payloadBytes(sectionPayloads.clientCommsSection),
    };
    this.logger.log(
      `LLM profile=parallel_sections_v1 model=${this.config.llmModel} globalTimeoutMs=${this.config.llmGlobalTimeoutMs} sectionTimeoutMs=${this.config.llmSectionTimeoutMs} payloadBytes(summary=${this.payloadBytes(summaryPayload)},executive=${sectionPayloadBytes.executiveSection},priority=${sectionPayloadBytes.prioritySection},execution=${sectionPayloadBytes.executionSection},clientComms=${sectionPayloadBytes.clientCommsSection})`,
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
    const enrichedReport = this.ensurePriorityDepth(
      sectionResult.report,
      normalizedInput,
      locale,
    );
    const gate = this.runQualityGate(
      summaryResult.summaryText,
      enrichedReport,
      normalizedInput,
    );
    const adminReport = this.withDeterministicCost(gate.report, locale);
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

    for (const warning of warnings) {
      if (warning.type === 'summary') {
        this.logger.warn(`LLM user summary failed: ${warning.message}`);
        adminReport.summaryWarning = this.text(
          locale,
          'Resume utilisateur LLM indisponible. Resume deterministe utilise.',
          'LLM user summary failed. Deterministic summary used.',
        );
      } else {
        this.logger.warn(`LLM expert section failed: ${warning.message}`);
      }
    }

    if (!gate.valid) {
      adminReport.qualityWarning = this.text(
        locale,
        'Sortie normalisee apres echec du quality gate.',
        'Output normalized after quality gate failure.',
      );
    }

    return { summaryText: gate.summaryText, adminReport };
  }

  private buildPayload(
    input: LangchainAuditInput,
    profile: LlmPayloadProfile,
  ): Record<string, unknown> {
    const caps =
      profile === 'summary'
        ? {
            quickWins: 6,
            findings: 6,
            affectedUrls: 4,
            sampledUrls: 12,
            pageRecaps: 12,
          }
        : profile === 'expert'
          ? {
              quickWins: 10,
              findings: 10,
              affectedUrls: 5,
              sampledUrls: 12,
              pageRecaps: 12,
            }
          : {
              quickWins: 8,
              findings: 6,
              affectedUrls: 4,
              sampledUrls: 8,
              pageRecaps: 8,
            };

    const compactFindings = input.deepFindings
      .slice(0, caps.findings)
      .map((finding) => ({
        code: finding.code,
        title: finding.title,
        description: finding.description,
        severity: finding.severity,
        confidence: finding.confidence,
        impact: finding.impact,
        recommendation: finding.recommendation,
        affectedUrls: finding.affectedUrls.slice(0, caps.affectedUrls),
      }));
    const compactSampledUrls = input.sampledUrls
      .slice(0, caps.sampledUrls)
      .map((entry) => ({
        url: entry.url,
        statusCode: entry.statusCode,
        indexable: entry.indexable,
        canonical: entry.canonical,
        title: entry.title ?? null,
        metaDescription: entry.metaDescription ?? null,
        h1Count: entry.h1Count ?? 0,
        htmlLang: entry.htmlLang ?? null,
        canonicalCount: entry.canonicalCount ?? 0,
        responseTimeMs: entry.responseTimeMs ?? null,
        server: entry.server ?? null,
        xPoweredBy: entry.xPoweredBy ?? null,
        setCookiePatterns: (entry.setCookiePatterns ?? []).slice(0, 8),
        cacheHeaders: entry.cacheHeaders ?? {},
        securityHeaders: entry.securityHeaders ?? {},
        error: entry.error,
      }));
    const compactPageRecaps = input.pageRecaps
      .slice(0, caps.pageRecaps)
      .map((entry) => ({
        url: entry.url,
        priority: entry.priority,
        wordingScore: entry.wordingScore,
        trustScore: entry.trustScore,
        ctaScore: entry.ctaScore,
        seoCopyScore: entry.seoCopyScore,
        topIssues: entry.topIssues.slice(0, 3),
        recommendations: entry.recommendations.slice(0, 3),
        source: entry.source,
      }));

    return {
      locale: input.locale,
      website: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      keyChecks: input.keyChecks,
      quickWins: input.quickWins.slice(0, caps.quickWins),
      pillarScores: input.pillarScores,
      deepFindings: compactFindings,
      sampledUrls: compactSampledUrls,
      pageRecaps: compactPageRecaps,
      pageSummary: input.pageSummary,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: {
        crawl: {
          keyChecks: input.keyChecks,
          sampledUrlsSummary: {
            totalInputUrls: input.sampledUrls.length,
            usedInPrompt: compactSampledUrls.length,
            nonIndexableCount: input.sampledUrls.filter(
              (item) => !item.indexable,
            ).length,
            errorCount: input.sampledUrls.filter((item) => Boolean(item.error))
              .length,
          },
        },
        findings: compactFindings,
        pageRecaps: compactPageRecaps,
        techFingerprint: input.techFingerprint,
      },
      sampledUrlsSummary: {
        totalInputUrls: input.sampledUrls.length,
        usedInPrompt: compactSampledUrls.length,
        nonIndexableCount: input.sampledUrls.filter((item) => !item.indexable)
          .length,
        errorCount: input.sampledUrls.filter((item) => Boolean(item.error))
          .length,
      },
      pageRecapSummary: {
        totalInputPages: input.pageRecaps.length,
        usedInPrompt: compactPageRecaps.length,
        highPriorityPages: input.pageRecaps.filter(
          (item) => item.priority === 'high',
        ).length,
      },
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

  private buildSectionPayloads(input: LangchainAuditInput): {
    executiveSection: Record<string, unknown>;
    prioritySection: Record<string, unknown>;
    executionSection: Record<string, unknown>;
    clientCommsSection: Record<string, unknown>;
  } {
    const compactFindings = input.deepFindings.slice(0, 10).map((finding) => ({
      code: finding.code,
      title: this.compactText(finding.title, 140),
      description: this.compactText(finding.description, 260),
      severity: finding.severity,
      confidence: finding.confidence,
      impact: finding.impact,
      recommendation: this.compactText(finding.recommendation, 260),
      affectedUrls: finding.affectedUrls.slice(0, 3),
    }));

    const compactRecaps = input.pageRecaps.slice(0, 10).map((entry) => ({
      url: entry.url,
      priority: entry.priority,
      wordingScore: entry.wordingScore,
      trustScore: entry.trustScore,
      ctaScore: entry.ctaScore,
      seoCopyScore: entry.seoCopyScore,
      topIssues: entry.topIssues
        .map((item) => this.compactText(item, 100))
        .slice(0, 3),
      recommendations: entry.recommendations
        .map((item) => this.compactText(item, 120))
        .slice(0, 3),
      source: entry.source,
    }));

    const compactUrls = input.sampledUrls.slice(0, 10).map((entry) => ({
      url: entry.url,
      statusCode: entry.statusCode,
      indexable: entry.indexable,
      canonical: entry.canonical,
      title: this.compactText(entry.title ?? '', 120) || null,
      metaDescription:
        this.compactText(entry.metaDescription ?? '', 180) || null,
      h1Count: entry.h1Count ?? 0,
      htmlLang: entry.htmlLang ?? null,
      canonicalCount: entry.canonicalCount ?? 0,
      responseTimeMs: entry.responseTimeMs ?? null,
      server: entry.server ?? null,
      xPoweredBy: entry.xPoweredBy ?? null,
      setCookiePatterns: (entry.setCookiePatterns ?? []).slice(0, 8),
      cacheHeaders: entry.cacheHeaders ?? {},
      securityHeaders: entry.securityHeaders ?? {},
      error: entry.error,
    }));

    const signalBuckets = {
      crawl: {
        keyChecks: input.keyChecks,
        sampledUrls: compactUrls,
      },
      findings: compactFindings,
      pageRecaps: compactRecaps,
      quickWins: input.quickWins
        .map((item) => this.compactText(item, 120))
        .slice(0, 10),
      techFingerprint: input.techFingerprint,
    };

    return {
      executiveSection: {
        locale: input.locale,
        website: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        keyChecks: input.keyChecks,
        quickWins: signalBuckets.quickWins.slice(0, 6),
        pillarScores: input.pillarScores,
        pageSummary: input.pageSummary,
        deepFindings: compactFindings.slice(0, 6),
        techFingerprint: input.techFingerprint,
        evidenceBuckets: signalBuckets,
      },
      prioritySection: {
        locale: input.locale,
        website: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        quickWins: signalBuckets.quickWins.slice(0, 8),
        deepFindings: compactFindings,
        sampledUrls: compactUrls,
        pageRecaps: compactRecaps,
        techFingerprint: input.techFingerprint,
        evidenceBuckets: signalBuckets,
      },
      executionSection: {
        locale: input.locale,
        website: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        quickWins: signalBuckets.quickWins.slice(0, 10),
        deepFindings: compactFindings,
        pageRecaps: compactRecaps,
        pageSummary: input.pageSummary,
        sampledUrls: compactUrls,
        techFingerprint: input.techFingerprint,
        evidenceBuckets: signalBuckets,
      },
      clientCommsSection: {
        locale: input.locale,
        website: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        quickWins: signalBuckets.quickWins.slice(0, 8),
        topFindings: compactFindings.slice(0, 6),
        pageSummary: input.pageSummary,
        techFingerprint: input.techFingerprint,
        evidenceBuckets: signalBuckets,
      },
    };
  }

  private compactText(value: string, maxChars: number): string {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxChars) return clean;
    return `${clean.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
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
        summaryText: this.buildFallbackSummary(input),
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

    const fallbackReport = this.buildFallbackExpertReport(
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
          }
        : {}),
      ...(clientCommsSection
        ? {
            clientMessageTemplate: clientCommsSection.clientMessageTemplate,
            clientLongEmail: clientCommsSection.clientLongEmail,
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
    const payloadBytes = this.payloadBytes(payload);
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
              ? 'Tu produis uniquement la partie execution avancee: implementationTodo, whatToFixThisWeek, whatToFixThisMonth, fastImplementationPlan, implementationBacklog, invoiceScope, conversionAndClarity, speedAndPerformance, credibilityAndTrust, techAndScalability et techFingerprint. Reponds en francais uniquement. Chaque chapitre doit etre detaille, bien ecrite, exploitable, et relie a des preuves. Mentionne CMS/framework/runtime principal avec confiance et evidences.'
              : 'Return only advanced execution outputs: implementationTodo, whatToFixThisWeek, whatToFixThisMonth, fastImplementationPlan, implementationBacklog, invoiceScope, conversionAndClarity, speedAndPerformance, credibilityAndTrust, techAndScalability, and techFingerprint. English only. Chapters must be implementation-ready and evidence-linked. State one primary CMS/framework/runtime guess with confidence and evidence.',
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
              ? "Tu produis uniquement clientMessageTemplate et clientLongEmail. Francais uniquement. clientMessageTemplate doit etre un rapport engageant donnant envie de continuer et d'avoir plus d'informations. clientLongEmail doit rester professionnel, actionnable, et coherent avec les priorites techniques sans inventer de donnees, Il doit etre complet et permettre d'avoir une vision global dans manque aujorud'hui et des actions demain."
              : 'Return only clientMessageTemplate and clientLongEmail. English only. clientMessageTemplate must be short (3-5 lines). clientLongEmail must stay professional, actionable, and aligned with technical priorities without inventing facts.',
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
              ? "Tu es un expert SEO technique, engineering web senior et PM delivery. Reponds uniquement en francais, ton technique et orienté execution. Fournis un rapport operationnel complet avec causes racines, remediation precise, dependances, criteres d'acceptation, priorisation impact/effort, et chapitres diagnostiques longs: conversionAndClarity, speedAndPerformance, seoFoundations, credibilityAndTrust, techAndScalability, scorecardAndBusinessOpportunities, plus techFingerprint (primaryStack, confidence, evidence, alternatives, unknowns). Utilise uniquement les donnees disponibles. Si non prouvable: Non verifiable."
              : 'You are a senior technical SEO, web engineering, and delivery PM expert. Respond only in English with an execution-first tone. Produce a complete implementation report with root causes, concrete remediations, dependencies, acceptance criteria, impact/effort prioritization, and long diagnostic chapters: conversionAndClarity, speedAndPerformance, seoFoundations, credibilityAndTrust, techAndScalability, scorecardAndBusinessOpportunities, plus techFingerprint (primaryStack, confidence, evidence, alternatives, unknowns). Use only provided data. If not provable, write Not verifiable.',
        },
        {
          role: 'system',
          content:
            locale === 'fr'
              ? 'Contrainte stricte: claims evidence-first, pas de speculation, pas de langue mixte. Limites visees: urlLevelImprovements max 8, implementationTodo max 8, whatToFixThisWeek max 5, whatToFixThisMonth max 6, fastImplementationPlan max 5, implementationBacklog max 10, invoiceScope max 10.'
              : 'Strict constraint: evidence-first claims, no speculation, no mixed language. Target limits: urlLevelImprovements up to 8, implementationTodo up to 8, whatToFixThisWeek up to 5, whatToFixThisMonth up to 6, fastImplementationPlan up to 5, implementationBacklog up to 10, invoiceScope up to 10.',
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
      this.buildFallbackSummary(input),
      this.ensurePriorityDepth(
        this.buildFallbackExpertReport(input, reason),
        input,
        input.locale,
      ),
      input,
    );

    const adminReport = this.withDeterministicCost(gate.report, input.locale);
    adminReport.qualityGate = {
      valid: gate.valid,
      reasons: gate.reasons,
      retried: false,
      fallback: true,
    };

    return {
      summaryText: gate.summaryText,
      adminReport,
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
      summaryText = this.buildFallbackSummary(input);
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
        message: this.isTimeoutError(error)
          ? `compact expert timeout: ${reason}`
          : `compact expert failed: ${reason}`,
      });
      this.logger.warn(
        `LLM expert compact failed after ${durationMs}ms: ${reason}`,
      );

      return {
        summaryText,
        report: this.buildFallbackExpertReport(input, reason),
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

  private buildFallbackSummary(input: LangchainAuditInput): string {
    const topQuickWins = input.quickWins.slice(0, 3);

    if (input.locale === 'en') {
      return `Context: Audit completed for ${input.normalizedUrl} with SEO, performance, conversion, trust, and technical checks.
Blockers: ${topQuickWins.join(', ') || 'Technical SEO baseline requires stabilization'}.
Business impact: Unresolved blockers can reduce qualified traffic, lead generation, and conversion predictability.
Immediate priorities: 1) Fix critical indexability/metadata issues. 2) Improve core page speed and mobile UX. 3) Strengthen CTA clarity and contact flow. 4) Validate stack-level reliability and tracking signals.`;
    }

    return `Contexte: Audit finalise pour ${input.normalizedUrl} avec analyse SEO, performance, conversion, confiance et technique.
Blocages: ${topQuickWins.join(', ') || 'La base SEO technique doit etre stabilisee'}.
Impacts business: Ces points peuvent freiner le trafic qualifie, la generation de leads et la conversion.
Priorites immediates: 1) Corriger indexabilite et metadata critiques. 2) Ameliorer vitesse des pages cles et mobile. 3) Clarifier CTA et parcours de contact. 4) Stabiliser le socle technique, securite et tracking.`;
  }

  private buildFallbackExpertReport(
    input: LangchainAuditInput,
    reason: string,
  ): ExpertReport {
    const topQuickWins = input.quickWins.slice(0, 8);
    const fallbackTechFingerprint = {
      primaryStack:
        input.techFingerprint.primaryStack ||
        this.text(input.locale, 'Non verifiable', 'Not verifiable'),
      confidence: Math.max(
        0,
        Math.min(1, Number(input.techFingerprint.confidence || 0)),
      ),
      evidence: (input.techFingerprint.evidence ?? []).slice(0, 8),
      alternatives: (input.techFingerprint.alternatives ?? []).slice(0, 4),
      unknowns: (input.techFingerprint.unknowns ?? []).slice(0, 5),
    };
    const fallbackChapters = {
      conversionAndClarity: this.text(
        input.locale,
        'Proposition de valeur et CTA a renforcer sur les pages business. Prioriser la reduction des frictions du formulaire et la clarte mobile. Evidence: quickWins + recaps pages.',
        'Value proposition and CTA quality should be strengthened on business pages. Prioritize contact friction reduction and mobile clarity. Evidence: quickWins + page recaps.',
      ),
      speedAndPerformance: this.text(
        input.locale,
        'Des pages lentes et des poids de pages eleves ralentissent crawl et conversion. Prioriser cache, compression images, JS critique, et verification Core Web Vitals.',
        'Slow pages and page-weight overhead limit crawl and conversion. Prioritize caching, image compression, critical JS reduction, and Core Web Vitals checks.',
      ),
      seoFoundations: this.text(
        input.locale,
        "Les fondations SEO (title, meta, H1, canonical, indexation) doivent etre standardisees sur les templates prioritaires pour eviter la cannibalisation et les pertes d'indexation.",
        'SEO foundations (title, meta, H1, canonical, indexability) should be standardized across priority templates to avoid cannibalization and indexation loss.',
      ),
      credibilityAndTrust: this.text(
        input.locale,
        'Renforcer preuves sociales, pages legales, signaux de confiance et schemas pour augmenter CTR et conversion.',
        'Strengthen social proof, legal pages, trust signals, and schema coverage to improve CTR and conversion.',
      ),
      techAndScalability: this.text(
        input.locale,
        `Stack principal detecte: ${fallbackTechFingerprint.primaryStack} (confiance ${Math.round(fallbackTechFingerprint.confidence * 100)}%). Prioriser securite headers, hygiene erreurs, supervision et maintenabilite des templates.`,
        `Detected primary stack: ${fallbackTechFingerprint.primaryStack} (confidence ${Math.round(fallbackTechFingerprint.confidence * 100)}%). Prioritize security headers, error hygiene, monitoring, and template maintainability.`,
      ),
      scorecardAndBusinessOpportunities: this.text(
        input.locale,
        'Quick wins immediats + plan P0/P1/P2 pour maximiser trafic qualifie et conversion en 30 jours, avec validation continue.',
        'Immediate quick wins + a P0/P1/P2 roadmap to maximize qualified traffic and conversion in 30 days, with continuous validation.',
      ),
    };

    const implementationTodo = topQuickWins.map((quickWin, index) => ({
      phase:
        input.locale === 'en' ? `Phase ${index + 1}` : `Phase ${index + 1}`,
      objective: quickWin,
      deliverable: this.text(
        input.locale,
        `Implementation validee pour: ${quickWin}`,
        `Validated implementation for: ${quickWin}`,
      ),
      estimatedHours: 2 + Math.min(index, 6),
      dependencies: index === 0 ? [] : [`Phase ${index}`],
    }));

    const whatToFixThisWeek = topQuickWins
      .slice(0, 5)
      .map((quickWin, index) => ({
        task: quickWin,
        goal: this.text(
          input.locale,
          'Corriger les blocages a fort impact SEO et conversion',
          'Fix high-impact SEO and conversion blockers',
        ),
        estimatedHours: 2 + Math.min(index, 4),
        risk: this.text(
          input.locale,
          'Dependance technique faible a moderee',
          'Low to medium technical dependency risk',
        ),
        dependencies: index === 0 ? [] : [topQuickWins[0]],
      }));

    const whatToFixThisMonth = input.deepFindings
      .slice(0, 8)
      .map((finding, index) => ({
        task: finding.title,
        goal: finding.recommendation,
        estimatedHours: 3 + Math.min(index, 6),
        risk:
          finding.severity === 'high'
            ? this.text(
                input.locale,
                'Risque business eleve si reporte',
                'High business risk if delayed',
              )
            : this.text(input.locale, 'Risque modere', 'Moderate risk'),
        dependencies: [],
      }));

    const fastImplementationPlan = topQuickWins.slice(0, 5).map((quickWin) => ({
      task: quickWin,
      whyItMatters: this.text(
        input.locale,
        'Action rapide avec impact direct sur la visibilite, l indexation ou la conversion.',
        'Fast action with direct impact on visibility, indexation, or conversion.',
      ),
      implementationSteps:
        input.locale === 'en'
          ? [
              'Validate impacted templates/pages',
              'Deploy in staging then production',
              'Verify via crawl and Search Console',
            ]
          : [
              'Valider les templates/pages impactees',
              'Deployer en preproduction puis production',
              'Verifier via crawl et Search Console',
            ],
      estimatedHours: 3,
      expectedImpact: this.text(
        input.locale,
        'Gain SEO/conversion court terme',
        'Short-term SEO/conversion gain',
      ),
      priority: 'high' as const,
    }));

    const implementationBacklog = input.deepFindings
      .slice(0, 10)
      .map((finding) => ({
        task: finding.title,
        priority: finding.severity,
        details: finding.recommendation,
        estimatedHours: finding.severity === 'high' ? 6 : 4,
        dependencies: [],
        acceptanceCriteria:
          input.locale === 'en'
            ? [
                'Fix deployed and verified',
                'Crawl/indexability validation without regression',
              ]
            : [
                'Correction deployee et verifiee',
                'Validation crawl/indexabilite sans regression',
              ],
      }));

    const invoiceScope = implementationTodo.map((todo) => ({
      item: todo.phase,
      description: todo.objective,
      estimatedHours: todo.estimatedHours,
    }));

    return {
      executiveSummary: this.text(
        input.locale,
        'Rapport genere en mode fallback: les priorites restent exploitables pour planifier la mise en oeuvre.',
        'Fallback report generated: priorities remain actionable for implementation planning.',
      ),
      reportExplanation: this.text(
        input.locale,
        'Ce document propose un plan d action SEO/technique oriente livraison et impact business, avec une priorisation rapide puis durable.',
        'This document provides a delivery-oriented SEO/technical action plan with fast-track and durable prioritization.',
      ),
      strengths: [],
      diagnosticChapters: fallbackChapters,
      techFingerprint: fallbackTechFingerprint,
      priorities: topQuickWins.map((quickWin, index) => ({
        title: quickWin,
        severity: index < 2 ? 'high' : index < 5 ? 'medium' : 'low',
        whyItMatters: this.text(
          input.locale,
          'Ce point influence directement l indexabilite, la visibilite SEO ou la conversion.',
          'This point directly impacts indexability, SEO visibility, or conversion.',
        ),
        recommendedFix: quickWin,
        estimatedHours: 2 + Math.min(index, 6),
      })),
      urlLevelImprovements: input.sampledUrls
        .filter((item) => item.error || !item.indexable)
        .slice(0, 12)
        .map((item) => ({
          url: item.url,
          issue:
            item.error ??
            this.text(
              input.locale,
              'URL non indexable',
              'Potentially non-indexable URL',
            ),
          recommendation: this.text(
            input.locale,
            'Corriger statut HTTP, directives robots et canonical pour securiser l indexation.',
            'Fix HTTP status, robots directives, and canonical signals to secure indexability.',
          ),
          impact: 'high' as const,
        })),
      implementationTodo,
      whatToFixThisWeek,
      whatToFixThisMonth,
      clientMessageTemplate: this.text(
        input.locale,
        'Bonjour, suite a l audit, nous recommandons une phase de corrections prioritaires immediates, puis un plan d optimisation structure sur les prochaines semaines.',
        'Hello, following the audit, we recommend an immediate priority remediation phase, followed by a structured optimization plan over the next weeks.',
      ),
      clientLongEmail:
        input.locale === 'en'
          ? 'Hello,\n\nWe completed a full audit of your site and identified high-impact actions for SEO visibility and conversion. We recommend a first 7-day remediation batch to remove blockers, then a deeper 3-4 week optimization batch to consolidate performance.\n\nEach action is prioritized, estimated, and mapped to validation criteria so execution can be tracked with low delivery risk.'
          : 'Bonjour,\n\nNous avons finalise un audit complet de votre site et identifie des actions a tres fort impact sur la visibilite SEO et la conversion. Nous proposons un premier lot de corrections rapides (7 jours) pour traiter les points bloquants, puis un second lot d optimisations plus profondes (3 a 4 semaines) pour consolider la performance.\n\nChaque action est priorisee, chiffree en charge, et associee a des criteres de validation pour piloter la mise en oeuvre de facon claire.',
      fastImplementationPlan,
      implementationBacklog,
      invoiceScope,
      warning: 'LLM fallback used',
      reason,
      keyChecks: input.keyChecks,
      quickWins: input.quickWins,
      pillarScores: input.pillarScores,
      sampledUrls: input.sampledUrls,
      pageRecaps: input.pageRecaps,
      pageSummary: input.pageSummary,
    } as ExpertReport;
  }

  private ensurePriorityDepth(
    report: ExpertReport,
    input: LangchainAuditInput,
    locale: AuditLocale,
  ): ExpertReport {
    const minimumPriorities = 8;
    const maximumPriorities = 12;

    const unique = new Set<string>();
    const priorities = [...report.priorities]
      .filter((entry) => entry.title.trim().length > 0)
      .slice(0, maximumPriorities);

    for (const entry of priorities) {
      unique.add(entry.title.trim().toLowerCase());
    }

    const sortedFindings = [...input.deepFindings].sort(
      (a, b) => this.severityRank(b.severity) - this.severityRank(a.severity),
    );

    for (const finding of sortedFindings) {
      if (priorities.length >= maximumPriorities) break;
      const key = finding.title.trim().toLowerCase();
      if (!key || unique.has(key)) continue;

      priorities.push({
        title: finding.title,
        severity: finding.severity,
        whyItMatters: this.text(
          locale,
          `Impact ${finding.impact}: ${finding.description}`,
          `${finding.impact} impact: ${finding.description}`,
        ),
        recommendedFix: finding.recommendation,
        estimatedHours: finding.severity === 'high' ? 6 : 4,
      });
      unique.add(key);
    }

    for (const win of input.quickWins) {
      if (priorities.length >= minimumPriorities) break;
      const key = win.trim().toLowerCase();
      if (!key || unique.has(key)) continue;

      priorities.push({
        title: win,
        severity: 'medium',
        whyItMatters: this.text(
          locale,
          'Action rapide pour renforcer la base SEO technique et la conversion.',
          'Fast action to strengthen technical SEO baseline and conversion.',
        ),
        recommendedFix: win,
        estimatedHours: 3,
      });
      unique.add(key);
    }

    return {
      ...report,
      priorities: priorities.slice(0, maximumPriorities),
    };
  }

  private withDeterministicCost(
    report: ExpertReport,
    locale: AuditLocale,
  ): Record<string, unknown> {
    const invoiceHours = this.sumHours(
      report.invoiceScope.map((item) => item.estimatedHours),
    );
    const backlogHours = this.sumHours(
      report.implementationBacklog.map((item) => item.estimatedHours),
    );
    const todoHours = this.sumHours(
      report.implementationTodo.map((item) => item.estimatedHours),
    );
    const prioritiesHours = this.sumHours(
      report.priorities.map((item) => item.estimatedHours),
    );
    const totalHours =
      invoiceHours || backlogHours || todoHours || prioritiesHours;

    const fastTrackHours = this.sumHours(
      report.fastImplementationPlan.map((item) => item.estimatedHours),
    );
    const rateMin = this.config.rateHourlyMin;
    const rateMax = this.config.rateHourlyMax;

    return {
      ...report,
      costEstimate: {
        currency: this.config.rateCurrency,
        hourlyRateMin: rateMin,
        hourlyRateMax: rateMax,
        totalEstimatedHours: totalHours,
        estimatedCostMin: this.roundCurrency(totalHours * rateMin),
        estimatedCostMax: this.roundCurrency(totalHours * rateMax),
        fastTrackHours,
        fastTrackCostMin: this.roundCurrency(fastTrackHours * rateMin),
        fastTrackCostMax: this.roundCurrency(fastTrackHours * rateMax),
        assumptions:
          locale === 'en'
            ? [
                'Estimation is automatically derived from estimated implementation hours.',
                'Hourly rates come from server configuration.',
                'Final budget may vary with real technical complexity and business constraints.',
              ]
            : [
                'Le chiffrage est determine automatiquement a partir des heures estimees.',
                'Les taux horaires proviennent de la configuration serveur.',
                'Le budget final peut varier selon complexite technique reelle et contraintes metier.',
              ],
      },
    };
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

  private payloadBytes(payload: Record<string, unknown>): number {
    try {
      return Buffer.byteLength(JSON.stringify(payload), 'utf8');
    } catch {
      return 0;
    }
  }

  private sumHours(values: number[]): number {
    const total = values.reduce<number>((acc, value) => {
      return Number.isFinite(value) ? acc + Math.max(0, value) : acc;
    }, 0);
    return Math.round(total * 10) / 10;
  }

  private roundCurrency(value: number): number {
    return Math.round(Math.max(0, value) * 100) / 100;
  }

  private severityRank(severity: 'high' | 'medium' | 'low'): number {
    switch (severity) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      default:
        return 1;
    }
  }

  private text(locale: AuditLocale, fr: string, en: string): string {
    return locale === 'en' ? en : fr;
  }

  private isTimeoutError(reason: unknown): boolean {
    const message = String(reason).toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
  }
}
