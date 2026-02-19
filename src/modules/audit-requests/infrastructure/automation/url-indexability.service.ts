import { Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { AUDIT_AUTOMATION_CONFIG } from '../../domain/token';
import type { AuditAutomationConfig } from './audit.config';
import { SafeFetchService } from './safe-fetch.service';

export interface UrlIndexabilityResult {
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  https?: boolean;
  redirectChain?: string[];
  ttfbMs?: number | null;
  totalResponseMs?: number | null;
  contentLength?: number | null;
  server?: string | null;
  xPoweredBy?: string | null;
  setCookiePatterns?: string[];
  cacheHeaders?: Record<string, string>;
  securityHeaders?: Record<string, string>;
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
}

@Injectable()
export class UrlIndexabilityService {
  constructor(
    @Inject(AUDIT_AUTOMATION_CONFIG)
    private readonly config: AuditAutomationConfig,
    private readonly safeFetch: SafeFetchService,
  ) {}

  async analyzeUrls(
    urls: string[],
    options: AnalyzeUrlsOptions = {},
  ): Promise<UrlIndexabilityResult[]> {
    if (urls.length === 0) return [];

    const concurrency = Math.min(
      this.config.urlAnalyzeConcurrency,
      Math.max(1, urls.length),
    );
    const results = Array<UrlIndexabilityResult>(urls.length);
    let cursor = 0;
    let done = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= urls.length) return;
        const result = await this.analyzeSingleUrl(urls[index]);
        results[index] = result;
        done += 1;
        if (options.onUrlAnalyzed) {
          await options.onUrlAnalyzed(result, done, urls.length);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results;
  }

  private async analyzeSingleUrl(url: string): Promise<UrlIndexabilityResult> {
    try {
      const response = await this.safeFetch.fetchText(url);
      const html = response.body ?? '';
      const $ = load(html);
      const robotsMeta = $('meta[name="robots"]').attr('content') ?? null;
      const canonicalUrls = $('link[rel="canonical"]')
        .toArray()
        .map((node) => $(node).attr('href')?.trim())
        .filter((href): href is string => Boolean(href));
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
      const hasStructuredData =
        $('script[type="application/ld+json"]').length > 0;
      const openGraphTags = $('meta[property^="og:"]')
        .toArray()
        .map((node) => $(node).attr('property')?.trim())
        .filter((value): value is string => Boolean(value));
      const openGraphTagCount = $('meta[property^="og:"]').length;
      const twitterTags = $('meta[name^="twitter:"]')
        .toArray()
        .map((node) => $(node).attr('name')?.trim())
        .filter((value): value is string => Boolean(value));
      const wordCount = this.computeWordCount($('body').text());
      const internalLinks = this.extractInternalLinks($, response.finalUrl);
      const internalLinkCount = internalLinks.length;
      const xRobotsTag = response.headers['x-robots-tag'] ?? null;
      const server = response.headers['server'] ?? null;
      const xPoweredBy = response.headers['x-powered-by'] ?? null;
      const cacheHeaders = this.pickHeaders(response.headers, [
        'cache-control',
        'cf-cache-status',
        'x-cache',
        'x-cache-hits',
        'age',
        'etag',
        'expires',
        'vary',
      ]);
      const securityHeaders = this.pickHeaders(response.headers, [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'cross-origin-embedder-policy',
      ]);
      const setCookiePatterns = this.extractSetCookiePatterns(
        response.headers['set-cookie'],
      );
      const loweredMeta = robotsMeta?.toLowerCase() ?? '';
      const loweredHeader = xRobotsTag?.toLowerCase() ?? '';
      const indexable =
        !loweredMeta.includes('noindex') && !loweredHeader.includes('noindex');
      const lowerHtml = html.toLowerCase();
      const textExcerpt = this.extractTextExcerpt($('body').text());
      const ctaHints = this.extractCtaHints($);

      return {
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
        detectedCmsHints: this.detectCmsHints(lowerHtml),
        hasAnalytics:
          /gtag\(|google-analytics|ga\(|matomo|plausible|umami/.test(lowerHtml),
        hasTagManager: /googletagmanager|gtm\.js|datalayer/.test(lowerHtml),
        hasPixel: /fbq\(|facebook pixel|tiktok pixel|linkedin insight/.test(
          lowerHtml,
        ),
        hasCookieBanner: /cookie|consent|onetrust|didomi|tarteaucitron/.test(
          lowerHtml,
        ),
        hasForms: $('form').length > 0,
        ctaHints,
        textExcerpt,
        internalLinks,
        internalLinkCount,
        error: null,
      };
    } catch (error) {
      return {
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

  private extractInternalLinks(
    $: ReturnType<typeof load>,
    finalUrl: string,
  ): string[] {
    let origin: string;
    try {
      origin = new URL(finalUrl).origin;
    } catch {
      return [];
    }

    const links = new Set<string>();
    for (const node of $('a[href]').toArray()) {
      const href = $(node).attr('href')?.trim();
      if (!href || href.startsWith('#')) continue;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      try {
        const absolute = new URL(href, finalUrl);
        if (!['http:', 'https:'].includes(absolute.protocol)) continue;
        if (absolute.origin !== origin) continue;
        absolute.hash = '';
        links.add(absolute.toString());
      } catch {
        continue;
      }
    }

    return Array.from(links).slice(0, 30);
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

  private detectCmsHints(html: string): string[] {
    const hints = new Set<string>();
    if (html.includes('wp-content') || html.includes('wordpress')) {
      hints.add('WordPress');
    }
    if (html.includes('/_next/') || html.includes('next.js')) {
      hints.add('Next.js');
    }
    if (html.includes('shopify')) {
      hints.add('Shopify');
    }
    if (html.includes('wix')) {
      hints.add('Wix');
    }
    if (html.includes('webflow')) {
      hints.add('Webflow');
    }
    if (html.includes('drupal')) {
      hints.add('Drupal');
    }
    if (html.includes('joomla')) {
      hints.add('Joomla');
    }
    return Array.from(hints);
  }

  private pickHeaders(
    headers: Record<string, string>,
    keys: string[],
  ): Record<string, string> {
    const picked: Record<string, string> = {};
    for (const key of keys) {
      const value = headers[key];
      if (!value) continue;
      picked[key] = value;
    }
    return picked;
  }

  private extractSetCookiePatterns(raw: string | undefined): string[] {
    if (!raw) return [];
    const matches: string[] = raw.match(/(?:^|,)\s*([^=;,\s]+)=/g) ?? [];
    const names: string[] = [];
    for (const chunk of matches) {
      const normalized = chunk
        .replace(/(?:^|,)\s*/, '')
        .replace(/=$/, '')
        .trim()
        .toLowerCase();
      if (!normalized) continue;
      names.push(normalized);
    }
    return Array.from(new Set(names)).slice(0, 12);
  }
}
