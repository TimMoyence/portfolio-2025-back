import type { CheerioAPI } from 'cheerio';
import { textesUniquesBornes } from '../../../../../common/domain/texte/textes-uniques-bornes';
import type { SafeFetchResult } from '../safe-fetch.service';
import { urlCandidateMemeOrigine } from './url.util';

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

const JSON_LD = 'script[type="application/ld+json"]';

export const BALISES = {
  description: 'meta[name="description" i]',
  robots: 'meta[name="robots" i], meta[name="googlebot" i]',
  auteur: 'meta[name="author" i]',
  canonical: 'link[rel~="canonical" i]',
  openGraph: 'meta[property^="og:"]',
  twitter: 'meta[name^="twitter:" i]',
} as const;

const APERCU_D_IMAGE = /max-image-preview\s*:\s*[\w-]*/g;
const SEPARATEURS_DE_DIRECTIVES = /[\s,;/]+/;
const DIRECTIVE_QUI_INTERDIT_L_INDEXATION = /^(?:[\w-]+:)?(?:noindex|none)$/;

export function interditLIndexation(
  directives: string | null | undefined,
): boolean {
  return (directives ?? '')
    .toLowerCase()
    .replace(APERCU_D_IMAGE, '')
    .split(SEPARATEURS_DE_DIRECTIVES)
    .some((jeton) => DIRECTIVE_QUI_INTERDIT_L_INDEXATION.test(jeton));
}

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

function extractInternalLinks($: CheerioAPI, finalUrl: string): string[] {
  const links = new Set<string>();
  for (const node of $('a[href]').toArray()) {
    const href = $(node).attr('href')?.trim();
    if (!href || href.startsWith('#')) continue;
    const lien = urlCandidateMemeOrigine(href, finalUrl);
    if (lien) links.add(lien);
  }

  return Array.from(links).slice(0, 30);
}

function attributsNonVides(
  $: CheerioAPI,
  selecteur: string,
  attribut: string,
): string[] {
  return $(selecteur)
    .toArray()
    .map((node) => $(node).attr(attribut)?.trim())
    .filter((valeur): valeur is string => Boolean(valeur));
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
  return textesUniquesBornes(
    matches.map((chunk) =>
      chunk
        .replace(/(?:^|,)\s*/, '')
        .replace(/=$/, '')
        .toLowerCase(),
    ),
    12,
  );
}

export interface EnTetesTechniques {
  server?: string | null;
  xPoweredBy?: string | null;
  setCookiePatterns?: string[];
  cacheHeaders?: Record<string, string>;
  securityHeaders?: Record<string, string>;
}

interface TraceursDetectes {
  hasAnalytics: boolean;
  hasTagManager: boolean;
  hasPixel: boolean;
  hasCookieBanner: boolean;
  hasForms: boolean;
}

function detecterLesTraceurs(
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

export interface SignauxDePage extends TraceursDetectes {
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
  internalLinks: string[];
}

const texteOuNull = (valeur: string | undefined): string | null =>
  valeur?.trim() || null;

export function lireSignauxDePage(
  $: CheerioAPI,
  html: string,
  finalUrl: string,
): SignauxDePage {
  const lowerHtml = html.toLowerCase();
  return {
    title: texteOuNull($('title').first().text()),
    metaDescription: texteOuNull($(BALISES.description).attr('content')),
    robotsMeta:
      attributsNonVides($, BALISES.robots, 'content').join(', ') || null,
    canonicalUrls: attributsNonVides($, BALISES.canonical, 'href'),
    h1Count: $('h1').length,
    htmlLang: texteOuNull($('html').attr('lang')),
    hasStructuredData: $(JSON_LD).length > 0,
    openGraphTags: attributsNonVides($, BALISES.openGraph, 'property'),
    twitterTags: attributsNonVides($, BALISES.twitter, 'name'),
    detectedCmsHints: detectCmsHints(lowerHtml),
    ...detecterLesTraceurs(lowerHtml, $),
    internalLinks: extractInternalLinks($, finalUrl),
  };
}

export interface ReponseTechnique extends Required<EnTetesTechniques> {
  finalUrl: string;
  statusCode: number;
  https: boolean;
  redirectChain: string[];
  ttfbMs: number;
  totalResponseMs: number;
  contentLength: number | null;
}

export function lireReponseTechnique(
  reponse: SafeFetchResult,
): ReponseTechnique {
  return {
    finalUrl: reponse.finalUrl,
    statusCode: reponse.statusCode,
    https: reponse.finalUrl.startsWith('https://'),
    redirectChain: reponse.redirectChain,
    ttfbMs: Math.round(reponse.ttfbMs),
    totalResponseMs: Math.round(reponse.totalMs),
    contentLength: reponse.contentLength,
    server: reponse.headers['server'] ?? null,
    xPoweredBy: reponse.headers['x-powered-by'] ?? null,
    setCookiePatterns: extractSetCookiePatterns(reponse.headers['set-cookie']),
    cacheHeaders: pickHeaders(reponse.headers, CACHE_HEADER_KEYS),
    securityHeaders: pickHeaders(reponse.headers, SECURITY_HEADER_KEYS),
  };
}

interface JsonLdLu {
  blocs: unknown[];
  illisibles: number;
}

export function lireJsonLd($: CheerioAPI): JsonLdLu {
  const lu: JsonLdLu = { blocs: [], illisibles: 0 };
  for (const node of $(JSON_LD).toArray()) {
    const brut = $(node).text().trim();
    if (!brut) continue;
    try {
      const parse: unknown = JSON.parse(brut);
      const valeurs: unknown[] = Array.isArray(parse) ? parse : [parse];
      for (const valeur of valeurs) lu.blocs.push(valeur);
    } catch {
      lu.illisibles += 1;
    }
  }
  return lu;
}
