import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { SafeFetchResult } from './safe-fetch.service';

export interface HomepageAuditSnapshot {
  finalUrl: string;
  statusCode: number;
  https: boolean;
  redirectChain: string[];
  ttfbMs: number;
  totalResponseMs: number;
  contentLength: number | null;
  server: string | null;
  xPoweredBy: string | null;
  setCookiePatterns: string[];
  cacheHeaders: Record<string, string>;
  securityHeaders: Record<string, string>;
  title: string | null;
  metaDescription: string | null;
  robotsMeta: string | null;
  canonicalUrls: string[];
  h1Count: number;
  htmlLang: string | null;
  hasStructuredData: boolean;
  openGraphTags: string[];
  twitterTags: string[];
  detectedCmsHints: string[];
  hasAnalytics: boolean;
  hasTagManager: boolean;
  hasPixel: boolean;
  hasCookieBanner: boolean;
  hasForms: boolean;
  internalLinks: string[];
}

@Injectable()
export class HomepageAnalyzerService {
  analyze(fetchResult: SafeFetchResult): HomepageAuditSnapshot {
    const html = fetchResult.body ?? '';
    const $ = load(html);

    const title = $('title').first().text().trim() || null;
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || null;
    const robotsMeta = $('meta[name="robots"]').attr('content')?.trim() || null;
    const canonicalUrls = $('link[rel="canonical"]')
      .toArray()
      .map((node) => $(node).attr('href')?.trim())
      .filter((href): href is string => Boolean(href));
    const h1Count = $('h1').length;
    const htmlLang = $('html').attr('lang')?.trim() || null;
    const hasStructuredData =
      $('script[type="application/ld+json"]').length > 0;
    const openGraphTags = $('meta[property^="og:"]')
      .toArray()
      .map((node) => $(node).attr('property')?.trim())
      .filter((value): value is string => Boolean(value));
    const twitterTags = $('meta[name^="twitter:"]')
      .toArray()
      .map((node) => $(node).attr('name')?.trim())
      .filter((value): value is string => Boolean(value));

    const lowerHtml = html.toLowerCase();
    const detectedCmsHints = this.detectCmsHints(lowerHtml);
    const internalLinks = this.extractInternalLinks($, fetchResult.finalUrl);

    return {
      finalUrl: fetchResult.finalUrl,
      statusCode: fetchResult.statusCode,
      https: fetchResult.finalUrl.startsWith('https://'),
      redirectChain: fetchResult.redirectChain,
      ttfbMs: Math.round(fetchResult.ttfbMs),
      totalResponseMs: Math.round(fetchResult.totalMs),
      contentLength: fetchResult.contentLength,
      server: fetchResult.headers['server'] ?? null,
      xPoweredBy: fetchResult.headers['x-powered-by'] ?? null,
      setCookiePatterns: this.extractSetCookiePatterns(
        fetchResult.headers['set-cookie'],
      ),
      cacheHeaders: this.pickHeaders(fetchResult.headers, [
        'cache-control',
        'cf-cache-status',
        'x-cache',
        'x-cache-hits',
        'age',
        'etag',
        'expires',
        'vary',
      ]),
      securityHeaders: this.pickHeaders(fetchResult.headers, [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'cross-origin-embedder-policy',
      ]),
      title,
      metaDescription,
      robotsMeta,
      canonicalUrls,
      h1Count,
      htmlLang,
      hasStructuredData,
      openGraphTags,
      twitterTags,
      detectedCmsHints,
      hasAnalytics: /gtag\(|google-analytics|ga\(|matomo|plausible|umami/.test(
        lowerHtml,
      ),
      hasTagManager: /googletagmanager|gtm\.js|datalayer/.test(lowerHtml),
      hasPixel: /fbq\(|facebook pixel|tiktok pixel|linkedin insight/.test(
        lowerHtml,
      ),
      hasCookieBanner: /cookie|consent|onetrust|didomi|tarteaucitron/.test(
        lowerHtml,
      ),
      hasForms: $('form').length > 0,
      internalLinks,
    };
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

  private extractInternalLinks(
    $: ReturnType<typeof load>,
    finalUrl: string,
  ): string[] {
    const origin = new URL(finalUrl).origin;
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
