import type { LangchainAuditInput } from './langchain-audit-report.service';
import type { FanoutSectionName } from './schemas/audit-report.schemas';
import { sanitizePromptInput } from './shared/prompt-sanitize.util';

export type LlmPayloadProfile = 'summary' | 'expert' | 'expert_compact';

interface PayloadCaps {
  quickWins: number;
  findings: number;
  affectedUrls: number;
  sampledUrls: number;
  pageRecaps: number;
}

const PROFILE_CAPS: Record<LlmPayloadProfile, PayloadCaps> = {
  summary: {
    quickWins: 6,
    findings: 6,
    affectedUrls: 4,
    sampledUrls: 12,
    pageRecaps: 12,
  },
  expert: {
    quickWins: 10,
    findings: 10,
    affectedUrls: 5,
    sampledUrls: 12,
    pageRecaps: 12,
  },
  expert_compact: {
    quickWins: 8,
    findings: 6,
    affectedUrls: 4,
    sampledUrls: 8,
    pageRecaps: 8,
  },
};

type SampledUrlEntry = LangchainAuditInput['sampledUrls'][number];
type PageRecapEntry = LangchainAuditInput['pageRecaps'][number];

function mapSampledUrl(
  entry: SampledUrlEntry,
  title: string | null,
  metaDescription: string | null,
): Record<string, unknown> {
  return {
    url: entry.url,
    statusCode: entry.statusCode,
    indexable: entry.indexable,
    canonical: entry.canonical,
    title,
    metaDescription,
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
  };
}

function mapPageRecap(
  entry: PageRecapEntry,
  topIssues: string[],
  recommendations: string[],
): Record<string, unknown> {
  return {
    url: entry.url,
    priority: entry.priority,
    wordingScore: entry.wordingScore,
    trustScore: entry.trustScore,
    ctaScore: entry.ctaScore,
    seoCopyScore: entry.seoCopyScore,
    topIssues,
    recommendations,
    source: entry.source,
  };
}

function buildSampledUrlsSummary(
  input: LangchainAuditInput,
  usedInPrompt: number,
): Record<string, number> {
  return {
    totalInputUrls: input.sampledUrls.length,
    usedInPrompt,
    nonIndexableCount: input.sampledUrls.filter((item) => !item.indexable)
      .length,
    errorCount: input.sampledUrls.filter((item) => Boolean(item.error)).length,
  };
}

export function buildPayload(
  input: LangchainAuditInput,
  profile: LlmPayloadProfile,
): Record<string, unknown> {
  const caps = PROFILE_CAPS[profile];

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

export type SectionPayloads = Record<
  FanoutSectionName,
  Record<string, unknown>
>;

export function buildSectionPayloads(
  input: LangchainAuditInput,
): SectionPayloads {
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

  const compactedRecaps = input.pageRecaps
    .slice(0, 10)
    .map((entry) =>
      mapPageRecap(
        entry,
        entry.topIssues.map((item) => compactText(item, 100)).slice(0, 3),
        entry.recommendations.map((item) => compactText(item, 120)).slice(0, 3),
      ),
    );

  const compactedUrls = input.sampledUrls
    .slice(0, 10)
    .map((entry) =>
      mapSampledUrl(
        entry,
        sanitizePromptInput(compactText(entry.title ?? '', 120)) || null,
        sanitizePromptInput(compactText(entry.metaDescription ?? '', 180)) ||
          null,
      ),
    );

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

  const safeWebsite = sanitizePromptInput(input.websiteName);
  const safeNormalizedUrl = sanitizePromptInput(input.normalizedUrl);

  return {
    executiveSection: {
      locale: input.locale,
      website: safeWebsite,
      normalizedUrl: safeNormalizedUrl,
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
      website: safeWebsite,
      normalizedUrl: safeNormalizedUrl,
      quickWins: signalBuckets.quickWins.slice(0, 8),
      deepFindings: compactedFindings,
      sampledUrls: compactedUrls,
      pageRecaps: compactedRecaps,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
    executionSection: {
      locale: input.locale,
      website: safeWebsite,
      normalizedUrl: safeNormalizedUrl,
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
      website: safeWebsite,
      normalizedUrl: safeNormalizedUrl,
      quickWins: signalBuckets.quickWins.slice(0, 8),
      topFindings: compactedFindings.slice(0, 6),
      pageSummary: input.pageSummary,
      techFingerprint: input.techFingerprint,
      evidenceBuckets: signalBuckets,
    },
  };
}

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

function compactSampledUrls(
  input: LangchainAuditInput,
  maxUrls: number,
): Array<Record<string, unknown>> {
  return input.sampledUrls
    .slice(0, maxUrls)
    .map((entry) =>
      mapSampledUrl(
        entry,
        entry.title ? sanitizePromptInput(entry.title) : null,
        entry.metaDescription
          ? sanitizePromptInput(entry.metaDescription)
          : null,
      ),
    );
}

function compactPageRecapsBasic(
  input: LangchainAuditInput,
  maxRecaps: number,
): Array<Record<string, unknown>> {
  return input.pageRecaps
    .slice(0, maxRecaps)
    .map((entry) =>
      mapPageRecap(
        entry,
        entry.topIssues.slice(0, 3),
        entry.recommendations.slice(0, 3),
      ),
    );
}

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
        sampledUrlsSummary: buildSampledUrlsSummary(
          input,
          compactedSampledUrls.length,
        ),
      },
      findings: compactedFindings,
      pageRecaps: compactedPageRecaps,
      techFingerprint: input.techFingerprint,
    },
    sampledUrlsSummary: buildSampledUrlsSummary(
      input,
      compactedSampledUrls.length,
    ),
    pageRecapSummary: {
      totalInputPages: input.pageRecaps.length,
      usedInPrompt: compactedPageRecaps.length,
      highPriorityPages: input.pageRecaps.filter(
        (item) => item.priority === 'high',
      ).length,
    },
  };
}

export function compactText(value: string, maxChars: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

export function payloadBytes(payload: Record<string, unknown>): number {
  try {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
  } catch {
    return 0;
  }
}
