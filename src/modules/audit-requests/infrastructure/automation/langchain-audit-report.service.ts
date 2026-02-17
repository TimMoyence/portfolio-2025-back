import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';

const reportSchema = z.object({
  summaryText: z.string().min(1),
  adminReport: z.object({
    executiveSummary: z.string(),
    strengths: z.array(z.string()),
    priorities: z.array(
      z.object({
        title: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        whyItMatters: z.string(),
        recommendedFix: z.string(),
      }),
    ),
    urlLevelImprovements: z.array(
      z.object({
        url: z.string(),
        issue: z.string(),
        recommendation: z.string(),
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
              ? 'Tu es un expert SEO technique. Réponds en français clair. Donne un résumé utilisateur court, puis un rapport admin structuré.'
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
    const summaryText =
      this.config.llmLanguage === 'fr'
        ? `Audit terminé pour ${input.normalizedUrl}. Priorités: ${input.quickWins.slice(0, 3).join(' ')}`
        : `Audit completed for ${input.normalizedUrl}. Priorities: ${input.quickWins.slice(0, 3).join(' ')}`;

    return {
      summaryText,
      adminReport: {
        warning: 'LLM fallback used',
        reason,
        keyChecks: input.keyChecks,
        quickWins: input.quickWins,
        pillarScores: input.pillarScores,
        sampledUrls: input.sampledUrls,
      },
    };
  }
}
