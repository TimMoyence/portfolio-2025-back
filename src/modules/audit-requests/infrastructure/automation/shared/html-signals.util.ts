import type { CheerioAPI } from 'cheerio';

export const CACHE_HEADER_KEYS = [
  'cache-control',
  'cf-cache-status',
  'x-cache',
  'x-cache-hits',
  'age',
  'etag',
  'expires',
  'vary',
] as const;

export const SECURITY_HEADER_KEYS = [
  'strict-transport-security',
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'cross-origin-embedder-policy',
] as const;

export function detectCmsHints(html: string): string[] {
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

export function extractInternalLinks(
  $: CheerioAPI,
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

export function extractCanonicalUrls($: CheerioAPI): string[] {
  return $('link[rel="canonical"]')
    .toArray()
    .map((node) => $(node).attr('href')?.trim())
    .filter((href): href is string => Boolean(href));
}

export function hasJsonLdStructuredData($: CheerioAPI): boolean {
  return $('script[type="application/ld+json"]').length > 0;
}

export function extractOpenGraphProperties($: CheerioAPI): string[] {
  return $('meta[property^="og:"]')
    .toArray()
    .map((node) => $(node).attr('property')?.trim())
    .filter((value): value is string => Boolean(value));
}

export function extractTwitterTagNames($: CheerioAPI): string[] {
  return $('meta[name^="twitter:"]')
    .toArray()
    .map((node) => $(node).attr('name')?.trim())
    .filter((value): value is string => Boolean(value));
}

export function pickHeaders(
  headers: Record<string, string>,
  keys: readonly string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = headers[key];
    if (!value) continue;
    picked[key] = value;
  }
  return picked;
}

export function extractSetCookiePatterns(raw: string | undefined): string[] {
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

export interface EnTetesTechniques {
  server?: string | null;
  xPoweredBy?: string | null;
  setCookiePatterns?: string[];
  cacheHeaders?: Record<string, string>;
  securityHeaders?: Record<string, string>;
}

export interface TraceursDetectes {
  hasAnalytics: boolean;
  hasTagManager: boolean;
  hasPixel: boolean;
  hasCookieBanner: boolean;
  hasForms: boolean;
}

export function detecterLesTraceurs(
  lowerHtml: string,
  $: CheerioAPI,
): TraceursDetectes {
  return {
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
