import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { EngineCoverage, EngineScore } from '../../domain/EngineCoverage';
import { AuditLocale } from '../../domain/audit-locale.util';
import {
  DeadlineExceededError,
  withHardTimeout,
} from './llm-execution.guardrails';
import { LlmLimiteParLaConfig } from './llm-executor.port';
import { isTimeoutError } from './shared/error.util';
import { localizedText } from './shared/locale-text.util';
import { traiterEnParallele } from './shared/traitement-concurrent.util';
import {
  engineCoverageSchema,
  engineScoreSchema,
} from './schemas/engine-coverage.schema';
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
  engineScores: engineCoverageSchema,
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
  engineScores: EngineCoverage;
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

const UNVERIFIABLE_BLOCKER_RE = /not verifiable|non verifiable/i;
const UNVERIFIABLE_ENGINE_SCORE = 50;

function priorityFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score < 45) return 'high';
  if (score < 65) return 'medium';
  return 'low';
}

export interface AnalyzePageRecapsOptions {
  onRecapReady?: (
    recap: PageAiRecap,
    done: number,
    total: number,
  ) => void | Promise<void>;
}

function constatsVides(): {
  strengths: string[];
  blockers: string[];
  opportunities: string[];
} {
  return { strengths: [], blockers: [], opportunities: [] };
}

@Injectable()
export class PageAiRecapService extends LlmLimiteParLaConfig {
  private readonly logger = new Logger(PageAiRecapService.name);

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

    const warnings: string[] = [];
    let llmAttempts = 0;
    let llmFailures = 0;
    let breakerOpen = false;

    const llm = this.config.openAiApiKey
      ? new ChatOpenAI({
          apiKey: this.config.openAiApiKey,
          model: this.config.llmModel,
          timeout: this.config.pageAiTimeoutMs,
          maxRetries: 0,
          temperature: 0,
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

    const recapForPage = async (
      page: UrlIndexabilityResult,
    ): Promise<PageAiRecap> => {
      if (breakerOpen) return this.buildFallbackRecap(input.locale, page);

      const analyzed = await this.analyzeSinglePage(input.locale, page, llm);
      if (analyzed.llmAttempted) {
        llmAttempts += 1;
        if (analyzed.llmFailed) llmFailures += 1;
        maybeOpenBreaker();
      }
      if (analyzed.warning) {
        warnings.push(analyzed.warning);
      }
      return analyzed.recap;
    };

    const recaps = await traiterEnParallele(
      input.pages,
      this.config.pageAiConcurrency,
      recapForPage,
      async (recap, done, total, page) => {
        if (recap.source === 'fallback') {
          warnings.push(`Fallback recap used for ${page.url}`);
        }
        await options.onRecapReady?.(recap, done, total);
      },
    );
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
                      ? "Tu dois aussi evaluer la couverture de la page par 4 moteurs distincts, en te basant sur les signaux aiSignals du payload (aiBotsAccess, citationWorthiness, structuredDataQuality) et les meta/headers. Produis un objet engineScores avec 4 entrees: google (Rich Results eligibility, hints Core Web Vitals, EEAT), bingChatGpt (structured data, IndexNow, acces des bots bingbot/chatgpt-user), perplexity (contenu citable, llms.txt, sources/dates/auteur), geminiOverviews (FAQPage/HowTo/Article, densite de contenu). Chaque entree contient engine (identifiant), score 0-100, indexable (bool), strengths/blockers/opportunities (max 5 chacun, courtes phrases actionnables). Base-toi uniquement sur les donnees fournies, sinon 'Non verifiable'."
                      : "You must also evaluate the page coverage by 4 distinct engines, based on the aiSignals payload (aiBotsAccess, citationWorthiness, structuredDataQuality) and meta/headers. Produce an engineScores object with 4 entries: google (Rich Results eligibility, Core Web Vitals hints, EEAT), bingChatGpt (structured data, IndexNow, bingbot/chatgpt-user access), perplexity (citable content, llms.txt, sources/dates/author), geminiOverviews (FAQPage/HowTo/Article schemas, content density). Each entry has engine (id), score 0-100, indexable (bool), strengths/blockers/opportunities (max 5 each, short actionable phrases). Only use provided data, otherwise write 'Not verifiable'.",
                },
                {
                  role: 'system',
                  content:
                    locale === 'fr'
                      ? "Contrainte stricte: aucune langue melangee, aucune speculation sans preuve. Si une donnee manque, ecris 'Non verifiable'."
                      : "Strict rule: no mixed language and no unsupported speculation. If data is missing, write 'Not verifiable'.",
                },
                {
                  role: 'system',
                  content:
                    locale === 'fr'
                      ? "P1.4 anti-hallucination moteurs: chaque score engineScores.*.score doit citer au moins une evidence observable dans le payload. Si aucune evidence n'est disponible pour un moteur, le score doit etre exactement 50 et blockers doit contenir 'Non verifiable'. Ne jamais inventer un score optimiste sans preuve."
                      : "P1.4 anti-hallucination for engines: each engineScores.*.score must cite at least one evidence observable in the payload. If no evidence is available for an engine, the score must be exactly 50 and blockers must contain 'Not verifiable'. Never invent an optimistic score without evidence.",
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
          engineScores: this.normalizeEngineCoverage(result.engineScores),
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
          error instanceof DeadlineExceededError || isTimeoutError(error)
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
      aiSignals: page.aiSignals ?? null,
    };
  }

  private normalizeEngineCoverage(
    coverage: z.infer<typeof engineCoverageSchema>,
  ): EngineCoverage {
    return {
      google: this.normalizeEngineScore(coverage.google, 'google'),
      bingChatGpt: this.normalizeEngineScore(
        coverage.bingChatGpt,
        'bing_chatgpt',
      ),
      perplexity: this.normalizeEngineScore(coverage.perplexity, 'perplexity'),
      geminiOverviews: this.normalizeEngineScore(
        coverage.geminiOverviews,
        'gemini_overviews',
      ),
    };
  }

  private normalizeEngineScore(
    value: z.infer<typeof engineScoreSchema>,
    expected: EngineScore['engine'],
  ): EngineScore {
    const blockers = value.blockers
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 5);

    const hasUnverifiableBlocker = blockers.some((entry) =>
      UNVERIFIABLE_BLOCKER_RE.test(entry),
    );
    const score = hasUnverifiableBlocker
      ? UNVERIFIABLE_ENGINE_SCORE
      : this.clampScore(value.score);

    return {
      engine: expected,
      score,
      indexable: Boolean(value.indexable),
      strengths: value.strengths
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 5),
      blockers,
      opportunities: value.opportunities
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 5),
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
        localizedText(locale, 'Balise title manquante', 'Missing title tag'),
      );
      recommendations.push(
        localizedText(
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
        localizedText(
          locale,
          'Meta description absente',
          'Missing meta description',
        ),
      );
      recommendations.push(
        localizedText(
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
        localizedText(
          locale,
          'Structure H1 non conforme',
          'Incorrect H1 structure',
        ),
      );
      recommendations.push(
        localizedText(
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
        localizedText(locale, 'Contenu trop faible', 'Thin page content'),
      );
      recommendations.push(
        localizedText(
          locale,
          'Renforcer le contenu pour couvrir l intention utilisateur.',
          'Expand the copy to fully cover user intent.',
        ),
      );
    }
    if (!page.hasForms || (page.ctaHints?.length ?? 0) === 0) {
      cta -= 14;
      topIssues.push(
        localizedText(
          locale,
          'CTA peu visible ou absent',
          'CTA visibility is weak or missing',
        ),
      );
      recommendations.push(
        localizedText(
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
        localizedText(
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
        localizedText(
          locale,
          'Page non indexable ou en erreur',
          'Page is non-indexable or in error',
        ),
      );
      recommendations.push(
        localizedText(
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
    const priority = priorityFromScore(minScore);

    return {
      url: page.url,
      finalUrl: page.finalUrl,
      priority,
      language: this.detectLanguage(page),
      wordingScore: wording,
      trustScore: trust,
      ctaScore: cta,
      seoCopyScore: seoCopy,
      summary: localizedText(
        locale,
        `Analyse heuristique: clarté ${wording}/100, confiance ${trust}/100, CTA ${cta}/100, SEO éditorial ${seoCopy}/100.`,
        `Heuristic recap: wording ${wording}/100, trust ${trust}/100, CTA ${cta}/100, SEO copy ${seoCopy}/100.`,
      ),
      topIssues: Array.from(new Set(topIssues)).slice(0, 6),
      recommendations: Array.from(new Set(recommendations)).slice(0, 6),
      source: 'fallback',
      engineScores: this.buildFallbackEngineCoverage(locale, page),
    };
  }

  private buildFallbackEngineCoverage(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): EngineCoverage {
    return {
      google: this.buildGoogleFallbackScore(locale, page),
      bingChatGpt: this.buildBingFallbackScore(locale, page),
      perplexity: this.buildPerplexityFallbackScore(locale, page),
      geminiOverviews: this.buildGeminiFallbackScore(locale, page),
    };
  }

  private buildGoogleFallbackScore(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): EngineScore {
    const indexable = Boolean(page.indexable);
    const richResults =
      page.aiSignals?.structuredDataQuality.googleRichResultsEligible;
    const { strengths, blockers, opportunities } = constatsVides();
    let score = 55;

    if (indexable) {
      score += 10;
      strengths.push(
        localizedText(locale, 'Page indexable', 'Page is indexable'),
      );
    } else {
      score -= 25;
      blockers.push(
        localizedText(locale, 'Page non indexable', 'Page is non-indexable'),
      );
    }
    if (richResults) {
      score += 15;
      strengths.push(
        localizedText(
          locale,
          'Eligible aux Rich Results',
          'Eligible for Rich Results',
        ),
      );
    } else {
      opportunities.push(
        localizedText(
          locale,
          'Ajouter des schemas eligibles Rich Results',
          'Add Rich Results eligible schemas',
        ),
      );
    }
    if ((page.responseTimeMs ?? 0) > 2500) {
      score -= 10;
      blockers.push(
        localizedText(
          locale,
          'Temps de reponse eleve (signal Core Web Vitals)',
          'High response time (Core Web Vitals signal)',
        ),
      );
    }

    return this.toEngineScore('google', score, indexable, {
      strengths,
      blockers,
      opportunities,
    });
  }

  private buildBingFallbackScore(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): EngineScore {
    const indexable = Boolean(page.indexable);
    const chatGptUser = page.aiSignals?.aiBotsAccess?.chatGptUser;
    const { strengths, blockers, opportunities } = constatsVides();
    let score = 50;

    if (page.hasStructuredData) {
      score += 10;
      strengths.push(
        localizedText(
          locale,
          'Donnees structurees presentes',
          'Structured data present',
        ),
      );
    } else {
      opportunities.push(
        localizedText(
          locale,
          'Ajouter des donnees structurees JSON-LD',
          'Add JSON-LD structured data',
        ),
      );
    }
    if (chatGptUser === 'allowed') {
      score += 15;
      strengths.push(
        localizedText(
          locale,
          'ChatGPT-User autorise par robots.txt',
          'ChatGPT-User allowed by robots.txt',
        ),
      );
    } else if (chatGptUser === 'disallowed') {
      score -= 15;
      blockers.push(
        localizedText(
          locale,
          'ChatGPT-User bloque par robots.txt',
          'ChatGPT-User blocked by robots.txt',
        ),
      );
    }
    opportunities.push(
      localizedText(
        locale,
        'Activer IndexNow pour Bing',
        'Enable IndexNow for Bing',
      ),
    );

    return this.toEngineScore(
      'bing_chatgpt',
      score,
      chatGptUser !== 'disallowed' && indexable,
      { strengths, blockers, opportunities },
    );
  }

  private buildPerplexityFallbackScore(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): EngineScore {
    const indexable = Boolean(page.indexable);
    const signals = page.aiSignals ?? null;
    const citation = signals?.citationWorthiness;
    const perplexityBot = signals?.aiBotsAccess?.perplexityBot;
    const { strengths, blockers, opportunities } = constatsVides();
    let score = 50;

    if (citation) {
      score = Math.round((score + citation.score) / 2);
      if (citation.hasSources) {
        strengths.push(
          localizedText(
            locale,
            'Sources citables presentes',
            'Citable sources present',
          ),
        );
      }
      if (citation.hasAuthor) {
        strengths.push(
          localizedText(locale, 'Auteur identifie', 'Author identified'),
        );
      }
      if (!citation.hasFacts) {
        opportunities.push(
          localizedText(
            locale,
            'Ajouter des faits datables et chiffres',
            'Add datable facts and figures',
          ),
        );
      }
    }
    if (perplexityBot === 'disallowed') {
      score -= 15;
      blockers.push(
        localizedText(
          locale,
          'PerplexityBot bloque par robots.txt',
          'PerplexityBot blocked by robots.txt',
        ),
      );
    }
    if (!signals?.llmsTxt?.present) {
      opportunities.push(
        localizedText(
          locale,
          'Publier un fichier llms.txt',
          'Publish an llms.txt file',
        ),
      );
    }

    return this.toEngineScore(
      'perplexity',
      score,
      perplexityBot !== 'disallowed' && indexable,
      { strengths, blockers, opportunities },
    );
  }

  private buildGeminiFallbackScore(
    locale: AuditLocale,
    page: UrlIndexabilityResult,
  ): EngineScore {
    const indexable = Boolean(page.indexable);
    const googleExtended = page.aiSignals?.aiBotsAccess?.googleExtended;
    const aiFriendly =
      page.aiSignals?.structuredDataQuality.aiFriendly ?? false;
    const wordCount = page.wordCount ?? 0;
    const { strengths, blockers, opportunities } = constatsVides();
    let score = 50;

    if (aiFriendly) {
      score += 15;
      strengths.push(
        localizedText(
          locale,
          'Schemas AI-friendly detectes',
          'AI-friendly schemas detected',
        ),
      );
    } else {
      opportunities.push(
        localizedText(
          locale,
          'Ajouter FAQPage / HowTo / Article',
          'Add FAQPage / HowTo / Article schemas',
        ),
      );
    }
    if (wordCount >= 400) {
      score += 10;
      strengths.push(localizedText(locale, 'Contenu dense', 'Dense content'));
    } else if (wordCount < 150) {
      score -= 10;
      blockers.push(
        localizedText(
          locale,
          'Contenu trop faible pour AI Overviews',
          'Content too thin for AI Overviews',
        ),
      );
    }
    if (googleExtended === 'disallowed') {
      score -= 10;
      blockers.push(
        localizedText(
          locale,
          'Google-Extended bloque',
          'Google-Extended blocked',
        ),
      );
    }

    return this.toEngineScore(
      'gemini_overviews',
      score,
      googleExtended !== 'disallowed' && indexable,
      { strengths, blockers, opportunities },
    );
  }

  private toEngineScore(
    engine: EngineScore['engine'],
    score: number,
    indexable: boolean,
    lists: {
      strengths: string[];
      blockers: string[];
      opportunities: string[];
    },
  ): EngineScore {
    return {
      engine,
      score: this.clampScore(score),
      indexable,
      strengths: Array.from(new Set(lists.strengths)).slice(0, 5),
      blockers: Array.from(new Set(lists.blockers)).slice(0, 5),
      opportunities: Array.from(new Set(lists.opportunities)).slice(0, 5),
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
}
