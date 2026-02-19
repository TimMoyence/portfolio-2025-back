// Recap service for per-page AI analysis in audit automation. Uses LLM to generate insights and falls back to heuristics on failure.
import { ChatOpenAI } from '@langchain/openai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AuditLocale } from '../../domain/audit-locale.util';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import {
  DeadlineExceededError,
  LlmInFlightLimiter,
  getSharedLlmInFlightLimiter,
  withHardTimeout,
} from './llm-execution.guardrails';
import { UrlIndexabilityResult } from './url-indexability.service';

const pageRecapSchema = z.object({
  summary: z.string().min(1),
  topIssues: z.array(z.string()).max(6),
  recommendations: z.array(z.string()).max(6),
  wordingScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  ctaScore: z.number().min(0).max(100),
  seoCopyScore: z.number().min(0).max(100),
  priority: z.enum(['high', 'medium', 'low']),
  language: z.enum(['fr', 'en', 'mixed', 'unknown']),
});

export interface PageAiRecap {
  url: string;
  finalUrl: string | null;
  priority: 'high' | 'medium' | 'low';
  language: 'fr' | 'en' | 'mixed' | 'unknown';
  wordingScore: number;
  trustScore: number;
  ctaScore: number;
  seoCopyScore: number;
  summary: string;
  topIssues: string[];
  recommendations: string[];
  source: 'llm' | 'fallback';
}

export interface PageAiRecapSummary {
  totalPages: number;
  llmRecaps: number;
  fallbackRecaps: number;
  priorityCounts: {
    high: number;
    medium: number;
    low: number;
  };
  averageScores: {
    wording: number;
    trust: number;
    cta: number;
    seoCopy: number;
  };
  topRecurringIssues: string[];
}

export interface AnalyzePageRecapsInput {
  locale: AuditLocale;
  websiteName: string;
  normalizedUrl: string;
  pages: UrlIndexabilityResult[];
}

export interface AnalyzePageRecapsOptions {
  onRecapReady?: (
    recap: PageAiRecap,
    done: number,
    total: number,
  ) => void | Promise<void>;
}

@Injectable()
export class PageAiRecapService {
  private readonly logger = new Logger(PageAiRecapService.name);
  private readonly llmLimiter: LlmInFlightLimiter;

  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
  ) {
    this.llmLimiter = getSharedLlmInFlightLimiter(this.config.llmInflightMax);
  }

  async analyzePages(
    input: AnalyzePageRecapsInput,
    options: AnalyzePageRecapsOptions = {},
  ): Promise<{
    recaps: PageAiRecap[];
    summary: PageAiRecapSummary;
    warnings: string[];
  }> {
    if (input.pages.length === 0) {
      return {
        recaps: [],
        summary: {
          totalPages: 0,
          llmRecaps: 0,
          fallbackRecaps: 0,
          priorityCounts: { high: 0, medium: 0, low: 0 },
          averageScores: {
            wording: 0,
            trust: 0,
            cta: 0,
            seoCopy: 0,
          },
          topRecurringIssues: [],
        },
        warnings: [],
      };
    }

    const recaps = Array<PageAiRecap>(input.pages.length);
    const warnings: string[] = [];
    const total = input.pages.length;
    const concurrency = Math.min(
      Math.max(1, this.config.pageAiConcurrency),
      Math.max(1, total),
    );
    let cursor = 0;
    let done = 0;
    let llmAttempts = 0;
    let llmFailures = 0;
    let breakerOpen = false;

    const llm = this.config.openAiApiKey
      ? new ChatOpenAI({
          apiKey: this.config.openAiApiKey,
          model: this.config.llmModel,
          timeout: this.config.pageAiTimeoutMs,
          maxRetries: 0,
          temperature: 0.2,
        })
      : null;

    const maybeOpenBreaker = (): void => {
      if (breakerOpen) return;
      if (llmAttempts < this.config.pageAiCircuitBreakerMinSamples) return;
      const failureRatio = llmFailures / Math.max(1, llmAttempts);
      if (failureRatio < this.config.pageAiCircuitBreakerFailureRatio) return;
      breakerOpen = true;
      const warning = `Page AI circuit breaker opened (failures=${llmFailures}/${llmAttempts}, threshold=${this.config.pageAiCircuitBreakerFailureRatio}).`;
      warnings.push(warning);
      this.logger.warn(warning);
    };

    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= total) return;

        const page = input.pages[index];
        let recap: PageAiRecap;
        if (breakerOpen) {
          recap = this.buildFallbackRecap(input.locale, page);
        } else {
          const analyzed = await this.analyzeSinglePage(
            input.locale,
            page,
            llm,
          );
          recap = analyzed.recap;
          if (analyzed.llmAttempted) {
            llmAttempts += 1;
            if (analyzed.llmFailed) llmFailures += 1;
            maybeOpenBreaker();
          }
          if (analyzed.warning) {
            warnings.push(analyzed.warning);
          }
        }

        recaps[index] = recap;
        done += 1;

        if (recap.source === 'fallback') {
          warnings.push(`Fallback recap used for ${page.url}`);
        }
        if (options.onRecapReady) {
          await options.onRecapReady(recap, done, total);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return {
      recaps,
      summary: this.buildSummary(recaps),
      warnings,
    };
  }

  private async analyzeSinglePage(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
    llm: ChatOpenAI | null,
  ): Promise<{
    recap: PageAiRecap;
    llmAttempted: boolean;
    llmFailed: boolean;
    warning?: string;
  }> {
    if (!llm || page.error || (page.statusCode ?? 500) >= 400) {
      return {
        recap: this.buildFallbackRecap(locale, page),
        llmAttempted: false,
        llmFailed: false,
      };
    }

    const payload = this.buildPayload(page);
    const chain = llm.withStructuredOutput(pageRecapSchema);

    try {
      const result = await this.llmLimiter.run(() =>
        withHardTimeout(
          `page_ai_recap:${page.url}`,
          this.config.pageAiTimeoutMs,
          (signal) =>
            chain.invoke(
              [
                {
                  role: 'system',
                  content:
                    locale === 'fr'
                      ? 'Tu realises un micro-audit de page complet (SEO + conversion + confiance + performance + hygiene technique). Reponds uniquement en francais. Tu dois evaluer: proposition de valeur, CTA et friction contact/mobile, fondations SEO (title/H1/meta/indexabilite/canonical), signaux de credibilite, hypotheses performance, et indices techniques (CMS/runtime visibles). Chaque topIssue et recommendation doit etre specifique et actionnable.'
                      : 'You perform a full page micro-audit (SEO + conversion + trust + performance + technical hygiene). Respond only in English. Evaluate value proposition, CTA/contact/mobile friction, SEO foundations (title/H1/meta/indexability/canonical), trust signals, performance hypotheses, and visible CMS/runtime clues. Each topIssue and recommendation must be specific and actionable.',
                },
                {
                  role: 'system',
                  content:
                    locale === 'fr'
                      ? "Contrainte stricte: aucune langue melangee, aucune speculation sans preuve. Si une donnee manque, ecris 'Non verifiable'."
                      : "Strict rule: no mixed language and no unsupported speculation. If data is missing, write 'Not verifiable'.",
                },
                {
                  role: 'user',
                  content: JSON.stringify(payload),
                },
              ],
              { signal },
            ),
        ),
      );

      return {
        recap: {
          url: page.url,
          finalUrl: page.finalUrl,
          priority: result.priority,
          language: result.language,
          wordingScore: this.clampScore(result.wordingScore),
          trustScore: this.clampScore(result.trustScore),
          ctaScore: this.clampScore(result.ctaScore),
          seoCopyScore: this.clampScore(result.seoCopyScore),
          summary: result.summary.trim(),
          topIssues: result.topIssues
            .map((entry) => entry.trim())
            .filter(Boolean)
            .slice(0, 6),
          recommendations: result.recommendations
            .map((entry) => entry.trim())
            .filter(Boolean)
            .slice(0, 6),
          source: 'llm',
        },
        llmAttempted: true,
        llmFailed: false,
      };
    } catch (error) {
      const reason = String(error);
      this.logger.warn(`Per-page recap failed for ${page.url}: ${reason}`);
      return {
        recap: this.buildFallbackRecap(locale, page),
        llmAttempted: true,
        llmFailed: true,
        warning:
          error instanceof DeadlineExceededError || this.isTimeoutError(error)
            ? `Page AI timeout fallback for ${page.url}`
            : `Page AI failure fallback for ${page.url}: ${reason}`,
      };
    }
  }

  private buildPayload(page: UrlIndexabilityResult): Record<string, unknown> {
    return {
      url: page.url,
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      indexable: page.indexable,
      title: page.title ?? null,
      metaDescription: page.metaDescription ?? null,
      h1Count: page.h1Count ?? 0,
      h1Texts: page.h1Texts ?? [],
      htmlLang: page.htmlLang ?? null,
      wordCount: page.wordCount ?? 0,
      textExcerpt: page.textExcerpt ?? '',
      ctaHints: page.ctaHints ?? [],
      hasStructuredData: page.hasStructuredData ?? false,
      openGraphTagCount: page.openGraphTagCount ?? 0,
      hasForms: page.hasForms ?? false,
      hasCookieBanner: page.hasCookieBanner,
      canonical: page.canonical,
      canonicalCount: page.canonicalCount ?? 0,
      responseTimeMs: page.responseTimeMs ?? null,
      server: page.server ?? null,
      xPoweredBy: page.xPoweredBy ?? null,
      setCookiePatterns: page.setCookiePatterns ?? [],
      cacheHeaders: page.cacheHeaders ?? {},
      securityHeaders: page.securityHeaders ?? {},
      detectedCmsHints: page.detectedCmsHints ?? [],
      hasAnalytics: page.hasAnalytics ?? false,
      hasTagManager: page.hasTagManager ?? false,
      hasPixel: page.hasPixel ?? false,
    };
  }

  private buildFallbackRecap(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): PageAiRecap {
    let wording = 55;
    let trust = 55;
    let cta = 50;
    let seoCopy = 55;
    const topIssues: string[] = [];
    const recommendations: string[] = [];

    if (!(page.title ?? '').trim()) {
      seoCopy -= 18;
      topIssues.push(
        this.text(locale, 'Balise title manquante', 'Missing title tag'),
      );
      recommendations.push(
        this.text(
          locale,
          'Definir un title unique oriente intention.',
          'Set a unique intent-aligned title.',
        ),
      );
    }
    if (!(page.metaDescription ?? '').trim()) {
      wording -= 10;
      seoCopy -= 16;
      topIssues.push(
        this.text(
          locale,
          'Meta description absente',
          'Missing meta description',
        ),
      );
      recommendations.push(
        this.text(
          locale,
          'Ajouter une meta persuasive avec proposition de valeur.',
          'Add a persuasive meta description with value proposition.',
        ),
      );
    }
    if ((page.h1Count ?? 1) !== 1) {
      wording -= 8;
      seoCopy -= 10;
      topIssues.push(
        this.text(
          locale,
          'Structure H1 non conforme',
          'Incorrect H1 structure',
        ),
      );
      recommendations.push(
        this.text(
          locale,
          'Conserver un seul H1 descriptif par page.',
          'Keep one descriptive H1 per page.',
        ),
      );
    }
    if ((page.wordCount ?? 0) < 120) {
      wording -= 12;
      seoCopy -= 8;
      topIssues.push(
        this.text(locale, 'Contenu trop faible', 'Thin page content'),
      );
      recommendations.push(
        this.text(
          locale,
          'Renforcer le contenu pour couvrir l intention utilisateur.',
          'Expand the copy to fully cover user intent.',
        ),
      );
    }
    if (!page.hasForms || (page.ctaHints?.length ?? 0) === 0) {
      cta -= 14;
      topIssues.push(
        this.text(
          locale,
          'CTA peu visible ou absent',
          'CTA visibility is weak or missing',
        ),
      );
      recommendations.push(
        this.text(
          locale,
          'Ajouter un CTA principal visible au-dessus de la ligne de flottaison.',
          'Add one visible primary CTA above the fold.',
        ),
      );
    } else {
      cta += 8;
    }
    if (!page.hasStructuredData) {
      trust -= 10;
      recommendations.push(
        this.text(
          locale,
          'Ajouter des schemas Organization/LocalBusiness/FAQ selon le contexte.',
          'Add relevant Organization/LocalBusiness/FAQ schema.',
        ),
      );
    } else {
      trust += 8;
    }
    if ((page.openGraphTagCount ?? 0) === 0) {
      trust -= 6;
    }
    if (!page.indexable || (page.statusCode ?? 500) >= 400) {
      seoCopy -= 20;
      trust -= 10;
      topIssues.push(
        this.text(
          locale,
          'Page non indexable ou en erreur',
          'Page is non-indexable or in error',
        ),
      );
      recommendations.push(
        this.text(
          locale,
          'Corriger status HTTP, directives robots et canonical.',
          'Fix HTTP status, robots directives, and canonical setup.',
        ),
      );
    }

    wording = this.clampScore(wording);
    trust = this.clampScore(trust);
    cta = this.clampScore(cta);
    seoCopy = this.clampScore(seoCopy);

    const minScore = Math.min(wording, trust, cta, seoCopy);
    const priority = minScore < 45 ? 'high' : minScore < 65 ? 'medium' : 'low';

    return {
      url: page.url,
      finalUrl: page.finalUrl,
      priority,
      language: this.detectLanguage(page),
      wordingScore: wording,
      trustScore: trust,
      ctaScore: cta,
      seoCopyScore: seoCopy,
      summary: this.text(
        locale,
        `Analyse heuristique: clarté ${wording}/100, confiance ${trust}/100, CTA ${cta}/100, SEO éditorial ${seoCopy}/100.`,
        `Heuristic recap: wording ${wording}/100, trust ${trust}/100, CTA ${cta}/100, SEO copy ${seoCopy}/100.`,
      ),
      topIssues: Array.from(new Set(topIssues)).slice(0, 6),
      recommendations: Array.from(new Set(recommendations)).slice(0, 6),
      source: 'fallback',
    };
  }

  private buildSummary(recaps: PageAiRecap[]): PageAiRecapSummary {
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    let wording = 0;
    let trust = 0;
    let cta = 0;
    let seoCopy = 0;
    let llmRecaps = 0;
    let fallbackRecaps = 0;
    const issueCount = new Map<string, number>();

    for (const recap of recaps) {
      priorityCounts[recap.priority] += 1;
      wording += recap.wordingScore;
      trust += recap.trustScore;
      cta += recap.ctaScore;
      seoCopy += recap.seoCopyScore;
      if (recap.source === 'llm') {
        llmRecaps += 1;
      } else {
        fallbackRecaps += 1;
      }
      for (const issue of recap.topIssues) {
        const key = issue.toLowerCase();
        issueCount.set(key, (issueCount.get(key) ?? 0) + 1);
      }
    }

    const total = recaps.length;
    const topRecurringIssues = [...issueCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([issue]) => issue);

    return {
      totalPages: total,
      llmRecaps,
      fallbackRecaps,
      priorityCounts,
      averageScores: {
        wording: this.clampScore(Math.round(wording / Math.max(1, total))),
        trust: this.clampScore(Math.round(trust / Math.max(1, total))),
        cta: this.clampScore(Math.round(cta / Math.max(1, total))),
        seoCopy: this.clampScore(Math.round(seoCopy / Math.max(1, total))),
      },
      topRecurringIssues,
    };
  }

  private detectLanguage(
    page: UrlIndexabilityResult,
  ): 'fr' | 'en' | 'mixed' | 'unknown' {
    const lang = (page.htmlLang ?? '').toLowerCase();
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('en')) return 'en';

    const corpus =
      `${page.title ?? ''} ${page.metaDescription ?? ''} ${page.textExcerpt ?? ''}`.toLowerCase();
    const hasFrenchMarkers =
      /(bonjour|votre|avec|pour|nous|vous|contactez)/.test(corpus);
    const hasEnglishMarkers = /(welcome|your|with|for|contact|book|about)/.test(
      corpus,
    );
    if (hasFrenchMarkers && hasEnglishMarkers) return 'mixed';
    if (hasFrenchMarkers) return 'fr';
    if (hasEnglishMarkers) return 'en';
    return 'unknown';
  }

  private clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private isTimeoutError(reason: unknown): boolean {
    const message = String(reason).toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
  }

  private text(locale: AuditLocale, fr: string, en: string): string {
    return locale === 'en' ? en : fr;
  }
}
