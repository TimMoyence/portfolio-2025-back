import { AuditLocale } from '../../domain/audit-locale.util';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
import { localizedText } from './shared/locale-text.util';
import { UrlIndexabilityResult } from './url-indexability.service';

interface TechSnapshot {
  url: string;
  detectedCmsHints?: string[];
  server?: string | null;
  xPoweredBy?: string | null;
  setCookiePatterns?: string[];
}

interface StackSignature {
  matches: (value: string) => boolean;
  name: string;
  score: number;
}

interface StackCandidate {
  score: number;
  evidence: string[];
}

export interface TechFingerprint {
  primaryStack: string;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  unknowns: string[];
}

const MIN_STACK_CONFIDENCE_SCORE = 3;

const SERVER_SIGNATURES: ReadonlyArray<StackSignature> = [
  {
    matches: (value) => value.includes('cloudflare'),
    name: 'Cloudflare edge stack',
    score: 1,
  },
  {
    matches: (value) => value.includes('nginx'),
    name: 'Nginx web stack',
    score: 1,
  },
  {
    matches: (value) => value.includes('apache'),
    name: 'Apache web stack',
    score: 1,
  },
  {
    matches: (value) => value.includes('iis'),
    name: 'Microsoft IIS / ASP.NET',
    score: 3,
  },
  {
    matches: (value) => value.includes('vercel'),
    name: 'Next.js on Vercel',
    score: 2,
  },
];

const X_POWERED_BY_SIGNATURES: ReadonlyArray<StackSignature> = [
  { matches: (value) => value.includes('next.js'), name: 'Next.js', score: 4 },
  {
    matches: (value) =>
      value.includes('node') ||
      value.includes('express') ||
      value.includes('nestjs'),
    name: 'Node.js runtime',
    score: 3,
  },
  { matches: (value) => value.includes('php'), name: 'PHP runtime', score: 3 },
  {
    matches: (value) => value.includes('asp.net'),
    name: 'ASP.NET runtime',
    score: 3,
  },
];

const COOKIE_SIGNATURES: ReadonlyArray<StackSignature> = [
  {
    matches: (cookie) => cookie.startsWith('wordpress_'),
    name: 'WordPress',
    score: 5,
  },
  {
    matches: (cookie) => cookie.includes('woocommerce'),
    name: 'WordPress + WooCommerce',
    score: 5,
  },
  {
    matches: (cookie) => cookie.includes('_shopify'),
    name: 'Shopify',
    score: 5,
  },
  {
    matches: (cookie) => cookie === 'phpsessid',
    name: 'PHP runtime',
    score: 3,
  },
  {
    matches: (cookie) => cookie.startsWith('__next'),
    name: 'Next.js',
    score: 2,
  },
  { matches: (cookie) => cookie.includes('wix'), name: 'Wix', score: 4 },
];

function addStackCandidate(
  candidates: Map<string, StackCandidate>,
  name: string,
  score: number,
  evidence: string,
): void {
  const normalized = name.trim();
  if (!normalized || score <= 0) return;

  const current = candidates.get(normalized) ?? { score: 0, evidence: [] };
  current.score += score;
  if (evidence && !current.evidence.includes(evidence)) {
    current.evidence.push(evidence);
  }
  candidates.set(normalized, current);
}

export function inferTechFingerprint(
  homepage: HomepageAuditSnapshot,
  urls: UrlIndexabilityResult[],
  locale: AuditLocale,
): TechFingerprint {
  const snapshots: TechSnapshot[] = [
    {
      url: homepage.finalUrl,
      detectedCmsHints: homepage.detectedCmsHints,
      server: homepage.server,
      xPoweredBy: homepage.xPoweredBy,
      setCookiePatterns: homepage.setCookiePatterns,
    },
    ...urls,
  ];
  const candidates = new Map<string, StackCandidate>();
  const unknowns = new Set<string>();

  for (const snapshot of snapshots) {
    collectStackSignals(snapshot, locale, candidates, unknowns);
  }

  return rankTechFingerprint(candidates, unknowns, locale);
}

function collectStackSignals(
  snapshot: TechSnapshot,
  locale: AuditLocale,
  candidates: Map<string, StackCandidate>,
  unknowns: Set<string>,
): void {
  for (const hint of snapshot.detectedCmsHints ?? []) {
    addStackCandidate(
      candidates,
      hint,
      3,
      `${hint} hint detected on ${snapshot.url}`,
    );
  }

  collectHeaderSignals(
    SERVER_SIGNATURES,
    (snapshot.server ?? '').toLowerCase(),
    'Server header includes',
    localizedText(
      locale,
      'Header Server non expose sur la majorite des pages',
      'Server header not disclosed on most pages',
    ),
    candidates,
    unknowns,
  );

  collectHeaderSignals(
    X_POWERED_BY_SIGNATURES,
    (snapshot.xPoweredBy ?? '').toLowerCase(),
    'x-powered-by includes',
    localizedText(
      locale,
      'Header x-powered-by masque',
      'x-powered-by header is hidden',
    ),
    candidates,
    unknowns,
  );

  collectCookieSignals(
    (snapshot.setCookiePatterns ?? []).map((entry) => entry.toLowerCase()),
    locale,
    candidates,
    unknowns,
  );
}

function collectHeaderSignals(
  signatures: ReadonlyArray<StackSignature>,
  headerValue: string,
  evidencePrefix: string,
  missingHeaderUnknown: string,
  candidates: Map<string, StackCandidate>,
  unknowns: Set<string>,
): void {
  if (!headerValue) unknowns.add(missingHeaderUnknown);

  const evidence = `${evidencePrefix} ${headerValue}`;
  for (const signature of signatures) {
    if (signature.matches(headerValue)) {
      addStackCandidate(candidates, signature.name, signature.score, evidence);
    }
  }
}

function collectCookieSignals(
  cookies: string[],
  locale: AuditLocale,
  candidates: Map<string, StackCandidate>,
  unknowns: Set<string>,
): void {
  if (cookies.length === 0) {
    unknowns.add(
      localizedText(
        locale,
        'Aucune signature framework deterministe dans Set-Cookie',
        'No deterministic Set-Cookie framework signature',
      ),
    );
  }

  const evidence = `Cookie signatures detected: ${cookies.join(', ')}`;
  for (const signature of COOKIE_SIGNATURES) {
    if (cookies.some((cookie) => signature.matches(cookie))) {
      addStackCandidate(candidates, signature.name, signature.score, evidence);
    }
  }
}

function rankTechFingerprint(
  candidates: Map<string, StackCandidate>,
  unknowns: Set<string>,
  locale: AuditLocale,
): TechFingerprint {
  const ranked = [...candidates.entries()].sort(
    (a, b) => b[1].score - a[1].score,
  );
  const best = ranked[0];

  if (!best || best[1].score < MIN_STACK_CONFIDENCE_SCORE) {
    return {
      primaryStack: localizedText(locale, 'Non verifiable', 'Not verifiable'),
      confidence: 0.2,
      evidence: [],
      alternatives: [],
      unknowns: Array.from(unknowns).slice(0, 5),
    };
  }

  const confidence = Math.max(0.3, Math.min(0.95, best[1].score / 10));
  return {
    primaryStack: best[0],
    confidence: Math.round(confidence * 100) / 100,
    evidence: best[1].evidence.slice(0, 8),
    alternatives: ranked.slice(1, 4).map(([name]) => name),
    unknowns: Array.from(unknowns).slice(0, 5),
  };
}
