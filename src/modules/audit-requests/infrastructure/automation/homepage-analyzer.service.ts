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

    return {
      finalUrl: fetchResult.finalUrl,
      statusCode: fetchResult.statusCode,
      https: fetchResult.finalUrl.startsWith('https://'),
      redirectChain: fetchResult.redirectChain,
      ttfbMs: Math.round(fetchResult.ttfbMs),
      totalResponseMs: Math.round(fetchResult.totalMs),
      contentLength: fetchResult.contentLength,
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
}
