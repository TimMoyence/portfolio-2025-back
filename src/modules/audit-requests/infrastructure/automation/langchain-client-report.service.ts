import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { AiIndexabilitySignals } from '../../domain/AiIndexability';
import type { ClientReportSynthesis } from '../../domain/AuditReportTiers';
import type { BusinessType } from '../../domain/BusinessType';
import { businessTypePromptHint } from '../../domain/BusinessType';
import type { EngineCoverage } from '../../domain/EngineCoverage';
import {
  AuditLocale,
  resolveAuditLocale,
} from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  LlmInFlightLimiter,
  getSharedLlmInFlightLimiter,
  withHardTimeout,
} from './llm-execution.guardrails';
import { localizedText } from './shared/locale-text.util';

const severitySchema = z.enum(['high', 'medium', 'low']);
const pillarStatusSchema = z.enum(['critical', 'warning', 'ok']);
const effortSchema = z.enum(['low', 'medium', 'high']);

const clientReportSchema = z.object({
  executiveSummary: z.string().min(1),
  topFindings: z
    .array(
      z.object({
        title: z.string().min(1),
        impact: z.string().min(1),
        severity: severitySchema,
      }),
    )
    .min(1)
    .max(5),
  googleVsAiMatrix: z.object({
    googleVisibility: z.object({
      score: z.number().min(0).max(100),
      summary: z.string().min(1),
    }),
    aiVisibility: z.object({
      score: z.number().min(0).max(100),
      summary: z.string().min(1),
    }),
  }),
  pillarScorecard: z
    .array(
      z.object({
        pillar: z.string().min(1),
        score: z.number().min(0).max(100),
        target: z.number().min(0).max(100),
        status: pillarStatusSchema,
      }),
    )
    .min(7)
    .max(7),
  quickWins: z
    .array(
      z.object({
        title: z.string().min(1),
        businessImpact: z.string().min(1),
        effort: effortSchema,
      }),
    )
    .min(3)
    .max(5),
  cta: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    actionLabel: z.string().min(1),
  }),
});

type ClientReportZodOutput = z.infer<typeof clientReportSchema>;

/**
 * Finding utilisee pour alimenter le prompt du rapport client.
 * Les champs sont volontairement courts et metier : le rapport client
 * ne doit pas exposer de details techniques.
 */
export interface ClientReportFinding {
  readonly title: string;
  readonly description: string;
  readonly severity: 'high' | 'medium' | 'low';
  readonly impact: 'traffic' | 'indexation' | 'conversion';
}

/**
 * Contexte passe au `LangchainClientReportService.generate`. Regroupe les
 * donnees dont le prompt client a besoin pour produire une synthese
 * strategique orientee decideur (sans details techniques).
 */
export interface ClientReportContext {
  readonly locale: AuditLocale;
  readonly websiteName: string;
  readonly normalizedUrl: string;
  readonly pillarScores: Record<string, number>;
  readonly findings: ReadonlyArray<ClientReportFinding>;
  readonly quickWins: ReadonlyArray<string>;
  readonly aggregateAiSignals: AiIndexabilitySignals | null;
  readonly engineCoverage: EngineCoverage | null;
  /**
   * Type d'activite detecte (P1.1). Permet au LLM d'adapter les
   * recommandations au modele economique observe (ecommerce, saas,
   * portfolio...). `'unknown'` ou absent = prompt generique.
   */
  readonly businessType?: BusinessType;
}

const PILLAR_ORDER: ReadonlyArray<string> = [
  'seo',
  'performance',
  'technical',
  'trust',
  'conversion',
  'aiVisibility',
  'citationWorthiness',
];

/**
 * Service d'agregation LLM produisant la synthese strategique (Tier Client)
 * du rapport d'audit. Le but est de donner envie au client final d'ouvrir
 * le PDF et de planifier un appel, sans exposer les details techniques.
 */
@Injectable()
export class LangchainClientReportService {
  private readonly logger = new Logger(LangchainClientReportService.name);
  private readonly llmLimiter: LlmInFlightLimiter;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {
    this.llmLimiter = getSharedLlmInFlightLimiter(this.config.llmInflightMax);
  }

  /**
   * Genere la synthese client (ClientReportSynthesis). Tente d'abord le
   * LLM ; en cas d'echec ou d'absence de cle API, retourne un fallback
   * deterministe construit depuis `pillarScores`, `findings` et
   * `quickWins`. Ne leve jamais — les erreurs LLM sont loggees.
   */
  async generate(context: ClientReportContext): Promise<ClientReportSynthesis> {
    const locale = resolveAuditLocale(
      context.locale,
      resolveAuditLocale(this.config.llmLanguage, 'fr'),
    );

    if (!this.config.openAiApiKey) {
      this.logger.log(
        'Client report: OPENAI_API_KEY missing, using deterministic fallback.',
      );
      return this.buildFallback(context, locale);
    }

    try {
      const llm = new ChatOpenAI({
        apiKey: this.config.openAiApiKey,
        model: this.config.llmModel,
        timeout: this.config.llmSummaryTimeoutMs,
        maxRetries: 0,
        temperature: 0.2,
      });
      const chain = llm.withStructuredOutput(clientReportSchema);
      const payload = this.buildPayload(context);

      const systemMessages = [
        {
          role: 'system' as const,
          content: this.systemPrompt(locale),
        },
        {
          role: 'system' as const,
          content: this.antiHallucinationPrompt(locale),
        },
      ];
      if (context.businessType && context.businessType !== 'unknown') {
        systemMessages.push({
          role: 'system' as const,
          content: businessTypePromptHint(context.businessType, locale),
        });
      }

      const llmResult = await this.llmLimiter.run(() =>
        withHardTimeout<ClientReportZodOutput>(
          'langchain:client_report',
          this.config.llmSummaryTimeoutMs,
          (signal) =>
            chain.invoke(
              [
                ...systemMessages,
                { role: 'user', content: JSON.stringify(payload) },
              ],
              { signal },
            ),
        ),
      );

      return this.normalizeLlmResult(llmResult, context);
    } catch (error) {
      this.logger.warn(`Client report LLM failed: ${String(error)}`);
      return this.buildFallback(context, locale);
    }
  }

  private systemPrompt(locale: AuditLocale): string {
    if (locale === 'fr') {
      return [
        'Tu rediges une synthese strategique destinee au decideur (client final), belle promesse de vente mais factuelle.',
        '',
        'Contraintes strictes :',
        '- Francais uniquement',
        '- Pas de markdown, pas de HTML',
        "- Pas de speculation (si une donnee manque, ecris 'Non verifiable')",
        '- Executive summary en 3 phrases max, oriente impact business',
        "- Top findings : 3-5 max, avec severity high/medium/low (doit refleter fidelement la severity source — jamais d'inflation)",
        '- Google vs AI matrix : 2 scores 0-100 + 1 phrase chacun',
        '- Pillar scorecard : exactement 7 piliers (seo, performance, technical, trust, conversion, aiVisibility, citationWorthiness)',
        '- Quick wins : 3-5 max, chacun avec un impact business concret',
        '- CTA : pousse vers un appel de 30 minutes pour approfondir',
        '',
        "Objectif : donner envie d'ouvrir le PDF et de nous rappeler. NE PAS inclure de details techniques.",
      ].join('\n');
    }
    return [
      'You write a strategic synthesis for the decision maker (end client), a compelling sales promise yet factual.',
      '',
      'Strict rules:',
      '- English only',
      '- No markdown, no HTML',
      "- No speculation (if data is missing, write 'Not verifiable')",
      '- Executive summary: max 3 sentences, business-impact oriented',
      '- Top findings: 3-5 max, severity high/medium/low (must mirror source severity — never inflate)',
      '- Google vs AI matrix: 2 scores 0-100 + 1 sentence each',
      '- Pillar scorecard: exactly 7 pillars (seo, performance, technical, trust, conversion, aiVisibility, citationWorthiness)',
      '- Quick wins: 3-5 max, each with a concrete business impact',
      '- CTA: push toward a 30-minute call to go deeper',
      '',
      'Goal: make the reader want to open the PDF and call us back. DO NOT include technical details.',
    ].join('\n');
  }

  private antiHallucinationPrompt(locale: AuditLocale): string {
    return locale === 'fr'
      ? "Rappel: chaque affirmation doit etre verifiable depuis le payload (pillarScores, findings, quickWins, engineCoverage, aggregateAiSignals). Si la donnee n'existe pas, ecris 'Non verifiable'. Aucune invention."
      : "Reminder: every claim must be verifiable from the payload (pillarScores, findings, quickWins, engineCoverage, aggregateAiSignals). If the data is missing, write 'Not verifiable'. No invention.";
  }

  private buildPayload(context: ClientReportContext): Record<string, unknown> {
    return {
      locale: context.locale,
      website: context.websiteName,
      normalizedUrl: context.normalizedUrl,
      businessType: context.businessType ?? 'unknown',
      pillarScores: context.pillarScores,
      findings: context.findings.slice(0, 8).map((entry) => ({
        title: entry.title,
        description: entry.description,
        severity: entry.severity,
        impact: entry.impact,
      })),
      quickWins: context.quickWins.slice(0, 8),
      aggregateAiSignals: context.aggregateAiSignals,
      engineCoverage: context.engineCoverage,
    };
  }

  private normalizeLlmResult(
    result: ClientReportZodOutput,
    context: ClientReportContext,
  ): ClientReportSynthesis {
    const topFindings = result.topFindings.slice(0, 5).map((finding) => ({
      title: this.cleanText(finding.title),
      impact: this.cleanText(finding.impact),
      severity: finding.severity,
    }));

    const quickWins = result.quickWins.slice(0, 5).map((entry) => ({
      title: this.cleanText(entry.title),
      businessImpact: this.cleanText(entry.businessImpact),
      effort: entry.effort,
    }));

    const pillarScorecard = this.ensureSevenPillars(
      result.pillarScorecard.map((entry) => ({
        pillar: entry.pillar,
        score: this.clampScore(entry.score),
        target: this.clampScore(entry.target),
        status: entry.status,
      })),
      context,
    );

    return {
      executiveSummary: this.cleanText(result.executiveSummary),
      topFindings,
      googleVsAiMatrix: {
        googleVisibility: {
          score: this.clampScore(
            result.googleVsAiMatrix.googleVisibility.score,
          ),
          summary: this.cleanText(
            result.googleVsAiMatrix.googleVisibility.summary,
          ),
        },
        aiVisibility: {
          score: this.clampScore(result.googleVsAiMatrix.aiVisibility.score),
          summary: this.cleanText(result.googleVsAiMatrix.aiVisibility.summary),
        },
      },
      pillarScorecard,
      quickWins,
      cta: {
        title: this.cleanText(result.cta.title),
        description: this.cleanText(result.cta.description),
        actionLabel: this.cleanText(result.cta.actionLabel),
      },
    };
  }

  /**
   * Garantit que le scorecard contient les 7 piliers attendus, en
   * completant avec des valeurs deterministes si le LLM en a oublie.
   */
  private ensureSevenPillars(
    llmPillars: Array<{
      pillar: string;
      score: number;
      target: number;
      status: 'critical' | 'warning' | 'ok';
    }>,
    context: ClientReportContext,
  ): ClientReportSynthesis['pillarScorecard'] {
    const byKey = new Map(
      llmPillars.map((entry) => [entry.pillar.toLowerCase(), entry]),
    );
    return PILLAR_ORDER.map((pillar) => {
      const existing = byKey.get(pillar.toLowerCase());
      if (existing) {
        return {
          pillar,
          score: existing.score,
          target: existing.target || 85,
          status: existing.status,
        };
      }
      const score = this.extractPillarScore(context.pillarScores, pillar);
      return {
        pillar,
        score,
        target: 85,
        status: this.statusFromScore(score),
      };
    });
  }

  /**
   * Construit une synthese client deterministe depuis les pillarScores,
   * findings et quickWins. Utilisee quand le LLM echoue.
   */
  private buildFallback(
    context: ClientReportContext,
    locale: AuditLocale,
  ): ClientReportSynthesis {
    const sortedFindings = [...context.findings]
      .filter((entry) => entry.title.trim().length > 0)
      .sort(
        (a, b) =>
          this.severityWeight(b.severity) - this.severityWeight(a.severity),
      );

    const topFindings = sortedFindings.slice(0, 5).map((finding) => ({
      title: finding.title,
      impact: localizedText(
        locale,
        `Impact ${finding.impact}: ${finding.description}`,
        `${finding.impact} impact: ${finding.description}`,
      ),
      severity: finding.severity,
    }));

    const fallbackFinding = {
      title: localizedText(
        locale,
        'Constat a valider lors de notre appel',
        'Finding to validate during our call',
      ),
      impact: localizedText(
        locale,
        "Impact business a quantifier lors de l'echange.",
        'Business impact to quantify during the call.',
      ),
      severity: 'medium' as const,
    };

    const ensuredFindings =
      topFindings.length > 0 ? topFindings : [fallbackFinding];

    const quickWins = this.buildFallbackQuickWins(context, locale);

    const pillarScorecard = PILLAR_ORDER.map((pillar) => {
      const score = this.extractPillarScore(context.pillarScores, pillar);
      return {
        pillar,
        score,
        target: 85,
        status: this.statusFromScore(score),
      };
    });

    const googleScore = this.averageScore([
      context.pillarScores.seo,
      context.pillarScores.performance,
      context.pillarScores.technical,
    ]);
    const aiScore = this.averageScore([
      context.pillarScores.aiVisibility,
      context.pillarScores.citationWorthiness,
      context.pillarScores.trust,
    ]);

    return {
      executiveSummary: localizedText(
        locale,
        `Audit finalise pour ${context.websiteName}. Des leviers concrets sont identifies pour ameliorer la visibilite Google et la presence sur les moteurs IA. Un appel de 30 minutes permet de prioriser le plan.`,
        `Audit completed for ${context.websiteName}. Concrete levers are identified to improve Google visibility and AI engine presence. A 30-minute call will help prioritize the plan.`,
      ),
      topFindings: ensuredFindings,
      googleVsAiMatrix: {
        googleVisibility: {
          score: googleScore,
          summary: localizedText(
            locale,
            'Visibilite Google evaluee sur SEO, performance et technique.',
            'Google visibility assessed on SEO, performance and technical.',
          ),
        },
        aiVisibility: {
          score: aiScore,
          summary: localizedText(
            locale,
            'Visibilite IA evaluee sur aiVisibility, citationWorthiness et trust.',
            'AI visibility assessed on aiVisibility, citationWorthiness and trust.',
          ),
        },
      },
      pillarScorecard,
      quickWins,
      cta: {
        title: localizedText(
          locale,
          'Planifier un appel de 30 minutes',
          'Schedule a 30-minute call',
        ),
        description: localizedText(
          locale,
          'Nous passons en revue les priorites et definissons un plan rapide a fort impact.',
          'We review the priorities and define a fast, high-impact plan.',
        ),
        actionLabel: localizedText(locale, "Reserver l'appel", 'Book the call'),
      },
    };
  }

  private buildFallbackQuickWins(
    context: ClientReportContext,
    locale: AuditLocale,
  ): ClientReportSynthesis['quickWins'] {
    type MutableQuickWin = {
      title: string;
      businessImpact: string;
      effort: 'low' | 'medium' | 'high';
    };
    const base: MutableQuickWin[] = context.quickWins
      .filter((entry) => entry.trim().length > 0)
      .slice(0, 5)
      .map((title) => ({
        title,
        businessImpact: localizedText(
          locale,
          'Gain rapide sur la visibilite ou la conversion.',
          'Quick gain on visibility or conversion.',
        ),
        effort: 'low' as const,
      }));

    if (base.length >= 3) return base;

    const filler: MutableQuickWin[] = [
      {
        title: localizedText(
          locale,
          'Renforcer les signaux de confiance cles',
          'Strengthen key trust signals',
        ),
        businessImpact: localizedText(
          locale,
          'Ameliore le taux de conversion sur les pages commerciales.',
          'Improves conversion on commercial pages.',
        ),
        effort: 'low',
      },
      {
        title: localizedText(
          locale,
          'Corriger les blocages techniques critiques',
          'Fix critical technical blockers',
        ),
        businessImpact: localizedText(
          locale,
          'Securise la visibilite Google et reduit les pertes de trafic.',
          'Secures Google visibility and reduces traffic losses.',
        ),
        effort: 'medium',
      },
      {
        title: localizedText(
          locale,
          'Ameliorer la citabilite par les moteurs IA',
          'Improve citability by AI engines',
        ),
        businessImpact: localizedText(
          locale,
          'Augmente la probabilite de citation dans ChatGPT, Perplexity et Gemini.',
          'Raises the chance of citation in ChatGPT, Perplexity, and Gemini.',
        ),
        effort: 'medium',
      },
    ];

    const merged: MutableQuickWin[] = [...base];
    for (const entry of filler) {
      if (merged.length >= 3) break;
      if (merged.some((existing) => existing.title === entry.title)) continue;
      merged.push(entry);
    }
    return merged.slice(0, 5);
  }

  private extractPillarScore(
    pillarScores: Record<string, number>,
    pillar: string,
  ): number {
    const raw = pillarScores[pillar];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return this.clampScore(raw);
    }
    return 0;
  }

  private statusFromScore(score: number): 'critical' | 'warning' | 'ok' {
    if (score >= 80) return 'ok';
    if (score >= 55) return 'warning';
    return 'critical';
  }

  private severityWeight(severity: 'high' | 'medium' | 'low'): number {
    if (severity === 'high') return 3;
    if (severity === 'medium') return 2;
    return 1;
  }

  private averageScore(values: Array<number | undefined>): number {
    const numeric = values.filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    );
    if (numeric.length === 0) return 0;
    const avg = numeric.reduce((acc, value) => acc + value, 0) / numeric.length;
    return this.clampScore(Math.round(avg));
  }

  private clampScore(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }
}
