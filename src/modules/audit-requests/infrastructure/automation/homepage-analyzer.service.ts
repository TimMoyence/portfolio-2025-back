import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { SafeFetchResult } from './safe-fetch.service';
import {
  CACHE_HEADER_KEYS,
  SECURITY_HEADER_KEYS,
  detectCmsHints,
  extractInternalLinks,
  extractSetCookiePatterns,
  pickHeaders,
} from './shared/html-signals.util';

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
    const detectedCmsHints = detectCmsHints(lowerHtml);
    const internalLinks = extractInternalLinks($, fetchResult.finalUrl);

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
      setCookiePatterns: extractSetCookiePatterns(fetchResult.headers['set-cookie']),
      cacheHeaders: pickHeaders(fetchResult.headers, CACHE_HEADER_KEYS),
      securityHeaders: pickHeaders(fetchResult.headers, SECURITY_HEADER_KEYS),
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

}
