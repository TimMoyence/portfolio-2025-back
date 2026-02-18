import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  AuditLocale,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  ReportQualityGateContext,
  ReportQualityGateResult,
  ReportQualityGateService,
} from './report-quality-gate.service';

const userSummarySchema = z.object({
  summaryText: z.string().min(1),
});

const expertReportSchema = z.object({
  executiveSummary: z.string(),
  reportExplanation: z.string(),
  strengths: z.array(z.string()),
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

type ExpertReport = z.infer<typeof expertReportSchema>;

export interface LangchainAuditInput {
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
}

export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
}

type LlmPayloadProfile = 'summary' | 'expert' | 'expert_compact';

@Injectable()
export class LangchainAuditReportService {
  private readonly logger = new Logger(LangchainAuditReportService.name);

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly qualityGate: ReportQualityGateService,
  ) {}

  async generate(input: LangchainAuditInput): Promise<LangchainAuditOutput> {
    const locale = resolveAuditLocale(
      input.locale,
      resolveAuditLocale(this.config.llmLanguage, 'fr'),
    );
    const normalizedInput: LangchainAuditInput = {
      ...input,
      locale,
    };

    if (!this.config.openAiApiKey) {
      return this.fallback(normalizedInput, 'OPENAI_API_KEY is missing');
    }

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

      return { summaryText: gate.summaryText, adminReport };
    } catch (error) {
      this.logger.warn(`LLM generation failed: ${String(error)}`);
      return this.fallback(normalizedInput, String(error));
    }
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

  private async generateUserSummary(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode = false,
  ): Promise<string> {
    const chain = llm.withStructuredOutput(userSummarySchema);
    const result = await chain.invoke([
      {
        role: 'system',
        content:
          locale === 'fr'
            ? "Tu rediges un resume client humain et utile pour un decideur non technique. Reponds uniquement en francais. Ton professionnel, concret, et sans melange de langue. Structure: contexte, blocages, impacts business, priorites immediates. N'invente aucune donnee. Si une information manque, indique 'Non verifiable'."
            : 'Write a human, business-first client summary for a non-technical stakeholder. Respond only in English with no language mixing. Keep it factual and implementation-oriented. Structure: context, blockers, business impact, immediate priorities. If data is missing, state: Not verifiable.',
      },
      ...(retryMode
        ? [
            {
              role: 'system' as const,
              content:
                locale === 'fr'
                  ? 'Contrainte stricte supplementaire: aucun melange de langue, aucune phrase vide, et seulement des recommandations exploitables.'
                  : 'Additional strict rule: no mixed language, no empty sentences, and only actionable recommendations.',
            },
          ]
        : []),
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ]);

    return result.summaryText;
  }

  private async generateExpertReport(
    llm: ChatOpenAI,
    payload: Record<string, unknown>,
    locale: AuditLocale,
    retryMode = false,
    compactMode = false,
  ): Promise<ExpertReport> {
    const chain = llm.withStructuredOutput(expertReportSchema);
    return chain.invoke([
      {
        role: 'system',
        content:
          locale === 'fr'
            ? "Tu es un expert SEO technique, engineering web senior et PM delivery. Reponds uniquement en francais, ton technique et orienté execution. Fournis un rapport operationnel: causes racines, remediation precise, dependances, criteres d'acceptation, plan d'execution. Tu dois produire entre 8 et 10 priorites (high/medium/low) avec effort estime. Utilise uniquement les donnees disponibles. Si un point n'est pas verifiable, ecris 'Non verifiable'."
            : 'You are a senior technical SEO, web engineering, and delivery PM expert. Respond only in English in a technical execution-oriented tone. Produce an implementation-ready report: root causes, concrete remediations, dependencies, acceptance criteria, and execution sequencing. You must provide between 8 and 10 prioritized actions (high/medium/low) with estimated effort. Use only provided data. If a point cannot be verified, write: Not verifiable.',
      },
      {
        role: 'system',
        content:
          locale === 'fr'
            ? 'Contrainte stricte: sortie concise. Limites visees: urlLevelImprovements max 8, implementationTodo max 8, whatToFixThisWeek max 5, whatToFixThisMonth max 6, fastImplementationPlan max 5, implementationBacklog max 10, invoiceScope max 10. Evite les phrases longues et la redondance.'
            : 'Strict constraint: concise output. Target limits: urlLevelImprovements up to 8, implementationTodo up to 8, whatToFixThisWeek up to 5, whatToFixThisMonth up to 6, fastImplementationPlan up to 5, implementationBacklog up to 10, invoiceScope up to 10. Avoid long sentences and redundancy.',
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
    ]);
  }

  private fallback(
    input: LangchainAuditInput,
    reason: string,
  ): LangchainAuditOutput {
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
      return `Audit completed for ${input.normalizedUrl}. Main opportunities: ${topQuickWins.join(', ') || 'technical SEO baseline hardening'}. Execute a first remediation batch in 7 days, then run a broader optimization sprint over 3-4 weeks with validation checkpoints (indexability, performance, conversion).`;
    }

    return `Nous avons finalise l'audit de ${input.normalizedUrl} avec une lecture combinee accessibilite, SEO technique, et qualite d'indexation sur un echantillon d'URLs representatif. Le site presente des points de fond solides, mais plusieurs optimisations peuvent generer des gains rapides sur la visibilite organique et la conversion.\n\nLes priorites immediates concernent surtout ${topQuickWins.join(', ') || 'la stabilisation de la base SEO technique'}. En traitant ces actions en premier, vous reduisez le risque de perte de trafic, ameliorez la comprehension des pages par Google, et facilitez la montee en performance commerciale.\n\nLa suite recommandee: executer un lot rapide en 7 jours, puis un lot d'optimisation plus large sur 3 a 4 semaines avec validation des resultats a chaque etape (indexabilite, performances, conversions).`;
  }

  private buildFallbackExpertReport(
    input: LangchainAuditInput,
    reason: string,
  ): ExpertReport {
    const topQuickWins = input.quickWins.slice(0, 8);

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

  private createLlm(timeoutMs: number): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: this.config.openAiApiKey,
      model: this.config.llmModel,
      timeout: timeoutMs,
      maxRetries: this.config.llmRetries,
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
