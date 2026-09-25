import { Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import type { AiIndexabilitySignals } from '../../domain/AiIndexability';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import { AiHeadersAnalyzerService } from './ai-headers-analyzer.service';
import type { AuditAutomationConfig } from './audit.config';
import { CitationWorthinessService } from './citation-worthiness.service';
import { SafeFetchService } from './safe-fetch.service';
import { StructuredDataQualityService } from './structured-data-quality.service';
import {
  CACHE_HEADER_KEYS,
  SECURITY_HEADER_KEYS,
  detectCmsHints,
  detecterLesTraceurs,
  type EnTetesTechniques,
  extractCanonicalUrls,
  extractInternalLinks,
  extractOpenGraphProperties,
  extractSetCookiePatterns,
  extractTwitterTagNames,
  hasJsonLdStructuredData,
  pickHeaders,
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
      const robotsMeta = $('meta[name="robots"]').attr('content') ?? null;
      const canonicalUrls = extractCanonicalUrls($);
      const canonical = canonicalUrls[0] ?? null;
      const canonicalCount = $('link[rel="canonical"]').length;
      const title = $('title').first().text().trim() || null;
      const metaDescription =
        $('meta[name="description"]').attr('content')?.trim() ?? null;
      const h1Count = $('h1').length;
      const h1Texts = $('h1')
        .toArray()
        .map((node) => $(node).text().replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 3);
      const htmlLang = $('html').attr('lang')?.trim() ?? null;
      const hasStructuredData = hasJsonLdStructuredData($);
      const openGraphTags = extractOpenGraphProperties($);
      const openGraphTagCount = $('meta[property^="og:"]').length;
      const twitterTags = extractTwitterTagNames($);
      const wordCount = this.computeWordCount($('body').text());
      const internalLinks = extractInternalLinks($, response.finalUrl);
      const internalLinkCount = internalLinks.length;
      const xRobotsTag = response.headers['x-robots-tag'] ?? null;
      const server = response.headers['server'] ?? null;
      const xPoweredBy = response.headers['x-powered-by'] ?? null;
      const cacheHeaders = pickHeaders(response.headers, CACHE_HEADER_KEYS);
      const securityHeaders = pickHeaders(
        response.headers,
        SECURITY_HEADER_KEYS,
      );
      const setCookiePatterns = extractSetCookiePatterns(
        response.headers['set-cookie'],
      );
      const loweredMeta = robotsMeta?.toLowerCase() ?? '';
      const loweredHeader = xRobotsTag?.toLowerCase() ?? '';
      const indexable =
        !loweredMeta.includes('noindex') && !loweredHeader.includes('noindex');
      const lowerHtml = html.toLowerCase();
      const textExcerpt = this.extractTextExcerpt($('body').text());
      const ctaHints = this.extractCtaHints($);

      const jsonLdBlocks = this.extractJsonLdBlocks($);
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
        structuredDataQuality: this.structuredDataQuality.analyze(jsonLdBlocks),
      };

      return {
        aiSignals,
        url,
        finalUrl: response.finalUrl,
        statusCode: response.statusCode,
        https: response.finalUrl.startsWith('https://'),
        redirectChain: response.redirectChain,
        ttfbMs: Math.round(response.ttfbMs),
        totalResponseMs: Math.round(response.totalMs),
        contentLength: response.contentLength,
        server,
        xPoweredBy,
        setCookiePatterns,
        cacheHeaders,
        securityHeaders,
        indexable,
        title,
        metaDescription,
        h1Count,
        h1Texts,
        htmlLang,
        robotsMeta,
        xRobotsTag,
        canonical,
        canonicalUrls,
        canonicalCount,
        responseTimeMs: response.totalMs,
        wordCount,
        hasStructuredData,
        openGraphTags,
        openGraphTagCount,
        twitterTags,
        detectedCmsHints: detectCmsHints(lowerHtml),
        ...detecterLesTraceurs(lowerHtml, $),
        ctaHints,
        textExcerpt,
        internalLinks,
        internalLinkCount,
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

  private computeWordCount(text: string): number {
    const normalized = text.replace(/\\s+/g, ' ').trim();
    if (!normalized) return 0;
    return normalized.split(' ').filter(Boolean).length;
  }

  private extractTextExcerpt(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.slice(0, 420);
  }

  private extractJsonLdBlocks($: ReturnType<typeof load>): unknown[] {
    const blocks: unknown[] = [];
    $('script[type="application/ld+json"]')
      .toArray()
      .forEach((node) => {
        const raw = $(node).text().trim();
        if (!raw) return;
        try {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const entry of parsed) blocks.push(entry);
          } else {
            blocks.push(parsed);
          }
        } catch {
          // JSON-LD malformé : ignoré, le score restera bas
        }
      });
    return blocks;
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
      const cleaned = raw.replace(/\s+/g, ' ').trim();
      if (!cleaned) continue;
      if (cleaned.length > 48) continue;
      values.add(cleaned);
    }

    return Array.from(values).slice(0, 8);
  }
}
