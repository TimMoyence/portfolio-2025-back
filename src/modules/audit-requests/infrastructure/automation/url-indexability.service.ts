import { Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { compacterBlancs } from '../../../../common/domain/texte/compacter-blancs';
import { compterMots } from '../../../../common/domain/texte/compter-mots';
import type { AiIndexabilitySignals } from '../../domain/AiIndexability';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import { AiHeadersAnalyzerService } from './ai-headers-analyzer.service';
import type { AuditAutomationConfig } from './audit.config';
import { CitationWorthinessService } from './citation-worthiness.service';
import { SafeFetchService } from './safe-fetch.service';
import { StructuredDataQualityService } from './structured-data-quality.service';
import {
  BALISES,
  type EnTetesTechniques,
  interditLIndexation,
  lireJsonLd,
  lireReponseTechnique,
  lireSignauxDePage,
} from './shared/html-signals.util';
import { traiterEnParallele } from './shared/traitement-concurrent.util';

export interface UrlIndexabilityResult extends EnTetesTechniques {
  aiSignals?: AiIndexabilitySignals | null;
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  https?: boolean;
  redirectChain?: string[];
  ttfbMs?: number | null;
  totalResponseMs?: number | null;
  contentLength?: number | null;
  indexable: boolean;
  title?: string | null;
  metaDescription?: string | null;
  h1Count?: number;
  h1Texts?: string[];
  htmlLang?: string | null;
  robotsMeta: string | null;
  xRobotsTag: string | null;
  canonical: string | null;
  canonicalUrls?: string[];
  canonicalCount?: number;
  responseTimeMs?: number | null;
  wordCount?: number;
  hasStructuredData?: boolean;
  openGraphTags?: string[];
  openGraphTagCount?: number;
  twitterTags?: string[];
  detectedCmsHints?: string[];
  hasAnalytics?: boolean;
  hasTagManager?: boolean;
  hasPixel?: boolean;
  hasCookieBanner?: boolean;
  hasForms?: boolean;
  ctaHints?: string[];
  textExcerpt?: string;
  internalLinks?: string[];
  internalLinkCount?: number;
  error: string | null;
}

export interface AnalyzeUrlsOptions {
  onUrlAnalyzed?: (
    result: UrlIndexabilityResult,
    done: number,
    total: number,
  ) => void | Promise<void>;
  robotsTxt?: string;
}

@Injectable()
export class UrlIndexabilityService {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly safeFetch: SafeFetchService,
    private readonly aiHeadersAnalyzer: AiHeadersAnalyzerService,
    private readonly citationWorthiness: CitationWorthinessService,
    private readonly structuredDataQuality: StructuredDataQualityService,
  ) {}

  async analyzeUrls(
    urls: string[],
    options: AnalyzeUrlsOptions = {},
  ): Promise<UrlIndexabilityResult[]> {
    if (urls.length === 0) return [];

    return traiterEnParallele(
      urls,
      this.config.urlAnalyzeConcurrency,
      (url) => this.analyzeSingleUrl(url, options.robotsTxt ?? ''),
      async (result, done, total) => {
        await options.onUrlAnalyzed?.(result, done, total);
      },
    );
  }

  private async analyzeSingleUrl(
    url: string,
    robotsTxt: string,
  ): Promise<UrlIndexabilityResult> {
    try {
      const response = await this.safeFetch.fetchText(url);
      const html = response.body ?? '';
      const $ = load(html);
      const signaux = lireSignauxDePage($, html, response.finalUrl);
      const xRobotsTag = response.headers['x-robots-tag'] ?? null;
      const indexable = ![signaux.robotsMeta, xRobotsTag].some(
        interditLIndexation,
      );
      const jsonLd = lireJsonLd($);
      const aiSignals: AiIndexabilitySignals = {
        llmsTxt: null,
        aiBotsAccess: this.aiHeadersAnalyzer.analyze(
          robotsTxt,
          response.headers,
        ),
        citationWorthiness: this.citationWorthiness.analyze(
          html,
          response.finalUrl || url,
        ),
        structuredDataQuality: this.structuredDataQuality.analyze(
          jsonLd.blocs,
          jsonLd.illisibles,
        ),
      };

      return {
        aiSignals,
        url,
        ...lireReponseTechnique(response),
        ...signaux,
        indexable,
        h1Texts: $('h1')
          .toArray()
          .map((node) => compacterBlancs($(node).text()))
          .filter(Boolean)
          .slice(0, 3),
        xRobotsTag,
        canonical: signaux.canonicalUrls[0] ?? null,
        canonicalCount: $(BALISES.canonical).length,
        responseTimeMs: response.totalMs,
        wordCount: compterMots($('body').text()),
        openGraphTagCount: $(BALISES.openGraph).length,
        ctaHints: this.extractCtaHints($),
        textExcerpt: this.extractTextExcerpt($('body').text()),
        internalLinkCount: signaux.internalLinks.length,
        error: null,
      };
    } catch (error) {
      return {
        aiSignals: null,
        url,
        finalUrl: null,
        statusCode: null,
        https: false,
        redirectChain: [],
        ttfbMs: null,
        totalResponseMs: null,
        contentLength: null,
        server: null,
        xPoweredBy: null,
        setCookiePatterns: [],
        cacheHeaders: {},
        securityHeaders: {},
        indexable: false,
        title: null,
        metaDescription: null,
        h1Count: 0,
        h1Texts: [],
        htmlLang: null,
        robotsMeta: null,
        xRobotsTag: null,
        canonical: null,
        canonicalUrls: [],
        canonicalCount: 0,
        responseTimeMs: null,
        wordCount: 0,
        hasStructuredData: false,
        openGraphTags: [],
        openGraphTagCount: 0,
        twitterTags: [],
        detectedCmsHints: [],
        hasAnalytics: false,
        hasTagManager: false,
        hasPixel: false,
        hasCookieBanner: false,
        hasForms: false,
        ctaHints: [],
        textExcerpt: '',
        internalLinks: [],
        internalLinkCount: 0,
        error: String(error),
      };
    }
  }

  private extractTextExcerpt(text: string): string {
    return compacterBlancs(text).slice(0, 420);
  }

  private extractCtaHints($: ReturnType<typeof load>): string[] {
    const values = new Set<string>();

    for (const node of $(
      'a,button,input[type="submit"],input[type="button"]',
    ).toArray()) {
      const raw =
        $(node).text().trim() ||
        $(node).attr('value')?.trim() ||
        $(node).attr('aria-label')?.trim() ||
        '';
      const cleaned = compacterBlancs(raw);
      if (!cleaned) continue;
      if (cleaned.length > 48) continue;
      values.add(cleaned);
    }

    return Array.from(values).slice(0, 8);
  }
}
