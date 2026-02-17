import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

const reportSchema = z.object({
  summaryText: z.string().min(1),
  adminReport: z.object({
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
    invoiceScope: z.array(
      z.object({
        item: z.string(),
        description: z.string(),
        estimatedHours: z.number().min(0).max(200),
      }),
    ),
  }),
});

export interface LangchainAuditInput {
  websiteName: string;
  normalizedUrl: string;
  keyChecks: Record<string, unknown>;
  quickWins: string[];
  pillarScores: Record<string, number>;
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
}

export interface LangchainAuditOutput {
  summaryText: string;
  adminReport: Record<string, unknown>;
}

@Injectable()
export class LangchainAuditReportService {
  private readonly logger = new Logger(LangchainAuditReportService.name);

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {}

  async generate(input: LangchainAuditInput): Promise<LangchainAuditOutput> {
    if (!this.config.openAiApiKey) {
      return this.fallback(input, 'OPENAI_API_KEY is missing');
    }

    try {
      const llm = new ChatOpenAI({
        apiKey: this.config.openAiApiKey,
        model: this.config.llmModel,
        timeout: this.config.llmTimeoutMs,
        maxRetries: this.config.llmRetries,
        temperature: 0.2,
      });

      const chain = llm.withStructuredOutput(reportSchema);
      const payload = {
        website: input.websiteName,
        normalizedUrl: input.normalizedUrl,
        keyChecks: input.keyChecks,
        quickWins: input.quickWins,
        pillarScores: input.pillarScores,
        sampledUrls: input.sampledUrls,
      };

      const result = await chain.invoke([
        {
          role: 'system',
          content:
            this.config.llmLanguage === 'fr'
              ? "Tu es un expert SEO technique et PM delivery. Réponds en français. summaryText doit être un texte utilisateur de 2 à 3 paragraphes (environ 180-260 mots), pédagogique, concret et rassurant, avec explications des impacts business. adminReport doit fournir un plan d'action opérationnel, une todo list d'implémentation phasée, et un cadrage devis/facturation."
              : 'You are a technical SEO expert. Return concise actionable content.',
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ]);

      return {
        summaryText: result.summaryText,
        adminReport: result.adminReport as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.warn(`LLM generation failed: ${String(error)}`);
      return this.fallback(input, String(error));
    }
  }

  private fallback(
    input: LangchainAuditInput,
    reason: string,
  ): LangchainAuditOutput {
    const topQuickWins = input.quickWins.slice(0, 5);
    const implementationTodo = topQuickWins.map((quickWin, index) => ({
      phase: `Phase ${index + 1}`,
      objective: quickWin,
      deliverable: `Implémentation validée pour: ${quickWin}`,
      estimatedHours: 2 + index,
      dependencies: index === 0 ? [] : [`Phase ${index}`],
    }));

    const invoiceScope = implementationTodo.map((todo) => ({
      item: todo.phase,
      description: todo.objective,
      estimatedHours: todo.estimatedHours,
    }));

    const summaryText =
      this.config.llmLanguage === 'fr'
        ? `Votre audit est terminé pour ${input.normalizedUrl}. Nous avons analysé l’accessibilité, les signaux SEO, la structure des pages et la qualité d’indexation sur un échantillon représentatif de vos URLs. Les résultats montrent des axes d’amélioration concrets, en priorité sur ${topQuickWins.slice(0, 2).join(' et ') || 'la structure SEO de base'}.\n\nL’objectif est d’augmenter la visibilité, réduire les pertes de trafic et améliorer la conversion en corrigeant d’abord les points à fort impact. Le plan proposé est découpé en étapes actionnables afin de faciliter le pilotage, le chiffrage et la facturation. Vous pouvez utiliser les actions prioritaires comme base immédiate de roadmap de production.`
        : `Audit completed for ${input.normalizedUrl}. Priorities: ${input.quickWins.slice(0, 3).join(' ')}`;

    return {
      summaryText,
      adminReport: {
        warning: 'LLM fallback used',
        reason,
        executiveSummary:
          'Audit généré en mode fallback. Les données techniques restent exploitables pour prioriser les corrections.',
        reportExplanation:
          "Ce rapport liste les actions à fort impact SEO/technique et propose une feuille de route d'implémentation structurée.",
        strengths: [],
        priorities: topQuickWins.map((quickWin, index) => ({
          title: quickWin,
          severity: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
          whyItMatters:
            'Ce point influence directement l’indexabilité, la visibilité SEO ou la conversion.',
          recommendedFix: quickWin,
          estimatedHours: 2 + index,
        })),
        urlLevelImprovements: input.sampledUrls
          .filter((item) => item.error || !item.indexable)
          .slice(0, 10)
          .map((item) => ({
            url: item.url,
            issue: item.error ?? 'URL potentiellement non indexable',
            recommendation:
              'Corriger le statut, les meta robots et la canonical pour sécuriser l’indexation.',
            impact: 'high' as const,
          })),
        implementationTodo,
        invoiceScope,
        keyChecks: input.keyChecks,
        quickWins: input.quickWins,
        pillarScores: input.pillarScores,
        sampledUrls: input.sampledUrls,
      },
    };
  }
}
