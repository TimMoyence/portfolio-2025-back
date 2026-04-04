import type { LangchainAuditInput } from './langchain-audit-report.service';
import { sanitizePromptInput } from './shared/prompt-sanitize.util';

/** Profil de payload LLM : summary, expert complet, ou expert compact. */
export type LlmPayloadProfile = 'summary' | 'expert' | 'expert_compact';

/**
 * Construit le payload envoye au LLM en fonction du profil demande.
 * Applique des limites de troncature (caps) differentes selon que
 * l'on genere le resume utilisateur ou le rapport expert.
 */
export function buildPayload(
  input: LangchainAuditInput,
  profile: LlmPayloadProfile,
): Record<string, unknown> {
  const caps =
    profile === 'summary'
      ? {
          quickWins: 6,
          findings: 6,
          affectedUrls: 4,
          sampledUrls: 12,
          pageRecaps: 12,
        }
      : profile === 'expert'
        ? {
            quickWins: 10,
            findings: 10,
            affectedUrls: 5,
            sampledUrls: 12,
            pageRecaps: 12,
          }
        : {
            quickWins: 8,
            findings: 6,
            affectedUrls: 4,
            sampledUrls: 8,
            pageRecaps: 8,
          };

  const compactedFindings = compactFindings(
    input,
    caps.findings,
    caps.affectedUrls,
  );
  const compactedSampledUrls = compactSampledUrls(input, caps.sampledUrls);
  const compactedPageRecaps = compactPageRecapsBasic(input, caps.pageRecaps);

  return {
    locale: input.locale,
    website: sanitizePromptInput(input.websiteName),
    normalizedUrl: sanitizePromptInput(input.normalizedUrl),
    keyChecks: input.keyChecks,
    quickWins: input.quickWins.slice(0, caps.quickWins),
    pillarScores: input.pillarScores,
    deepFindings: compactedFindings,
    sampledUrls: compactedSampledUrls,
    pageRecaps: compactedPageRecaps,
    pageSummary: input.pageSummary,
    techFingerprint: input.techFingerprint,
    ...buildEvidenceBuckets(
      input,
      compactedFindings,
      compactedSampledUrls,
      compactedPageRecaps,
    ),
  };
}

/**
 * Construit les 4 payloads de section pour le profil fan-out parallele.
 * Chaque section recoit un sous-ensemble pertinent des donnees d'entree.
 */
export function buildSectionPayloads(input: LangchainAuditInput): {
  executiveSection: Record<string, unknown>;
  prioritySection: Record<string, unknown>;
  executionSection: Record<string, unknown>;
  clientCommsSection: Record<string, unknown>;
} {
  const compactedFindings = input.deepFindings.slice(0, 10).map((finding) => ({
    code: finding.code,
    title: compactText(finding.title, 140),
    description: compactText(finding.description, 260),
    severity: finding.severity,
    confidence: finding.confidence,
    impact: finding.impact,
    recommendation: compactText(finding.recommendation, 260),
    affectedUrls: finding.affectedUrls.slice(0, 3),
  }));

  const compactedRecaps = input.pageRecaps.slice(0, 10).map((entry) => ({
    url: entry.url,
    priority: entry.priority,
    wordingScore: entry.wordingScore,
    trustScore: entry.trustScore,
    ctaScore: entry.ctaScore,
    seoCopyScore: entry.seoCopyScore,
    topIssues: entry.topIssues
      .map((item) => compactText(item, 100))
      .slice(0, 3),
    recommendations: entry.recommendations
      .map((item) => compactText(item, 120))
      .slice(0, 3),
    source: entry.source,
  }));

  const compactedUrls = input.sampledUrls.slice(0, 10).map((entry) => ({
    url: entry.url,
    statusCode: entry.statusCode,
    indexable: entry.indexable,
    canonical: entry.canonical,
    title: compactText(entry.title ?? '', 120) || null,
    metaDescription: compactText(entry.metaDescription ?? '', 180) || null,
    h1Count: entry.h1Count ?? 0,
    htmlLang: entry.htmlLang ?? null,
    canonicalCount: entry.canonicalCount ?? 0,
    responseTimeMs: entry.responseTimeMs ?? null,
    server: entry.server ?? null,
    xPoweredBy: entry.xPoweredBy ?? null,
    setCookiePatterns: (entry.setCookiePatterns ?? []).slice(0, 8),
    cacheHeaders: entry.cacheHeaders ?? {},
    securityHeaders: entry.securityHeaders ?? {},
    error: entry.error,
  }));

  const signalBuckets = {
    crawl: {
      keyChecks: input.keyChecks,
      sampledUrls: compactedUrls,
    },
    findings: compactedFindings,
    pageRecaps: compactedRecaps,
    quickWins: input.quickWins
      .map((item) => compactText(item, 120))
      .slice(0, 10),
    techFingerprint: input.techFingerprint,
  };

  return {
    executiveSection: {
      locale: input.locale,
      website: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      keyChecks: input.keyChecks,
      quickWins: signalBuckets.quickWins.slice(0, 6),
      pillarScores: input.pillarScores,
      pageSummary: input.pageSummary,
      deepFindings: compactedFindings.slice(0, 6),
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
    prioritySection: {
      locale: input.locale,
      website: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      quickWins: signalBuckets.quickWins.slice(0, 8),
      deepFindings: compactedFindings,
      sampledUrls: compactedUrls,
      pageRecaps: compactedRecaps,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
    executionSection: {
      locale: input.locale,
      website: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      quickWins: signalBuckets.quickWins.slice(0, 10),
      deepFindings: compactedFindings,
      pageRecaps: compactedRecaps,
      pageSummary: input.pageSummary,
      sampledUrls: compactedUrls,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
    clientCommsSection: {
      locale: input.locale,
      website: input.websiteName,
      normalizedUrl: input.normalizedUrl,
      quickWins: signalBuckets.quickWins.slice(0, 8),
      topFindings: compactedFindings.slice(0, 6),
      pageSummary: input.pageSummary,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
  };
}

/** Tronque les findings de l'input avec des caps sur le nombre et les URLs affectees. */
function compactFindings(
  input: LangchainAuditInput,
  maxFindings: number,
  maxAffectedUrls: number,
): Array<Record<string, unknown>> {
  return input.deepFindings.slice(0, maxFindings).map((finding) => ({
    code: finding.code,
    title: finding.title,
    description: finding.description,
    severity: finding.severity,
    confidence: finding.confidence,
    impact: finding.impact,
    recommendation: finding.recommendation,
    affectedUrls: finding.affectedUrls.slice(0, maxAffectedUrls),
  }));
}

/** Tronque la liste d'URLs echantillonnees a maxUrls elements. */
function compactSampledUrls(
  input: LangchainAuditInput,
  maxUrls: number,
): Array<Record<string, unknown>> {
  return input.sampledUrls.slice(0, maxUrls).map((entry) => ({
    url: entry.url,
    statusCode: entry.statusCode,
    indexable: entry.indexable,
    canonical: entry.canonical,
    title: entry.title ?? null,
    metaDescription: entry.metaDescription ?? null,
    h1Count: entry.h1Count ?? 0,
    htmlLang: entry.htmlLang ?? null,
    canonicalCount: entry.canonicalCount ?? 0,
    responseTimeMs: entry.responseTimeMs ?? null,
    server: entry.server ?? null,
    xPoweredBy: entry.xPoweredBy ?? null,
    setCookiePatterns: (entry.setCookiePatterns ?? []).slice(0, 8),
    cacheHeaders: entry.cacheHeaders ?? {},
    securityHeaders: entry.securityHeaders ?? {},
    error: entry.error,
  }));
}

/** Tronque les recaps de page a maxRecaps elements en limitant issues/recommendations. */
function compactPageRecapsBasic(
  input: LangchainAuditInput,
  maxRecaps: number,
): Array<Record<string, unknown>> {
  return input.pageRecaps.slice(0, maxRecaps).map((entry) => ({
    url: entry.url,
    priority: entry.priority,
    wordingScore: entry.wordingScore,
    trustScore: entry.trustScore,
    ctaScore: entry.ctaScore,
    seoCopyScore: entry.seoCopyScore,
    topIssues: entry.topIssues.slice(0, 3),
    recommendations: entry.recommendations.slice(0, 3),
    source: entry.source,
  }));
}

/** Construit les buckets d'evidence (crawl, findings, pageRecaps, tech) pour le prompt. */
function buildEvidenceBuckets(
  input: LangchainAuditInput,
  compactedFindings: Array<Record<string, unknown>>,
  compactedSampledUrls: Array<Record<string, unknown>>,
  compactedPageRecaps: Array<Record<string, unknown>>,
): Record<string, unknown> {
  return {
    evidenceBuckets: {
      crawl: {
        keyChecks: input.keyChecks,
        sampledUrlsSummary: {
          totalInputUrls: input.sampledUrls.length,
          usedInPrompt: compactedSampledUrls.length,
          nonIndexableCount: input.sampledUrls.filter((item) => !item.indexable)
            .length,
          errorCount: input.sampledUrls.filter((item) => Boolean(item.error))
            .length,
        },
      },
      findings: compactedFindings,
      pageRecaps: compactedPageRecaps,
      techFingerprint: input.techFingerprint,
    },
    sampledUrlsSummary: {
      totalInputUrls: input.sampledUrls.length,
      usedInPrompt: compactedSampledUrls.length,
      nonIndexableCount: input.sampledUrls.filter((item) => !item.indexable)
        .length,
      errorCount: input.sampledUrls.filter((item) => Boolean(item.error))
        .length,
    },
    pageRecapSummary: {
      totalInputPages: input.pageRecaps.length,
      usedInPrompt: compactedPageRecaps.length,
      highPriorityPages: input.pageRecaps.filter(
        (item) => item.priority === 'high',
      ).length,
    },
  };
}

/**
 * Tronque un texte a maxChars caracteres en nettoyant les espaces multiples.
 * Ajoute des points de suspension si le texte est trop long.
 */
export function compactText(value: string, maxChars: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

/**
 * Calcule la taille en octets d'un payload JSON.
 * Retourne 0 en cas d'erreur de serialisation.
 */
export function payloadBytes(payload: Record<string, unknown>): number {
  try {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
  } catch {
    return 0;
  }
}
