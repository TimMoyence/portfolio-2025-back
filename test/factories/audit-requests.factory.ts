import type { ClientReportSynthesis } from '../../src/modules/audit-requests/domain/AuditReportTiers';
import type { IAuditRequestsRepository } from '../../src/modules/audit-requests/domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../../src/modules/audit-requests/domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../../src/modules/audit-requests/domain/IAuditQueue.port';
import { AuditRequest } from '../../src/modules/audit-requests/domain/AuditRequest';
import type { AuditSnapshot } from '../../src/modules/audit-requests/domain/AuditProcessing';
import type {
  AiBotsAccess,
  CitationWorthinessScore,
} from '../../src/modules/audit-requests/domain/AiIndexability';
import type {
  EngineCoverage,
  EngineScore,
} from '../../src/modules/audit-requests/domain/EngineCoverage';
import type { StructuredDataQualityResult } from '../../src/modules/audit-requests/domain/StructuredDataQuality';
import type { HomepageAuditSnapshot } from '../../src/modules/audit-requests/infrastructure/automation/homepage-analyzer.service';
import type { LangchainAuditInput } from '../../src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service';
import type { ClientReportContext } from '../../src/modules/audit-requests/infrastructure/automation/langchain-client-report.service';
import type { PageAiRecap } from '../../src/modules/audit-requests/infrastructure/automation/page-ai-recap.service';
import type { UrlIndexabilityResult } from '../../src/modules/audit-requests/infrastructure/automation/url-indexability.service';

export function buildAuditRequest(
  overrides?: Partial<AuditRequest>,
): AuditRequest {
  const request = new AuditRequest();
  request.id = 'audit-req-1';
  request.websiteName = 'example.com';
  request.contactMethod = 'EMAIL';
  request.contactValue = 'test@example.com';
  request.locale = 'fr';
  request.done = false;
  request.ip = null;
  request.userAgent = null;
  request.referer = null;
  return Object.assign(request, overrides);
}

export function buildAuditSnapshot(
  overrides?: Partial<AuditSnapshot>,
): AuditSnapshot {
  return {
    id: 'audit-1',
    requestId: 'req-1',
    websiteName: 'example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    locale: 'fr',
    done: false,
    processingStatus: 'RUNNING',
    progress: 50,
    step: 'crawling',
    error: null,
    normalizedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    redirectChain: [],
    keyChecks: {},
    quickWins: [],
    pillarScores: {},
    summaryText: null,
    fullReport: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    startedAt: new Date('2026-01-01T00:00:00Z'),
    finishedAt: null,
    ...overrides,
  };
}

export function buildHomepageSnapshot(
  overrides: Partial<HomepageAuditSnapshot> = {},
): HomepageAuditSnapshot {
  return {
    finalUrl: 'https://example.com/',
    statusCode: 200,
    https: true,
    redirectChain: [],
    ttfbMs: 250,
    totalResponseMs: 700,
    contentLength: 120000,
    server: 'nginx',
    xPoweredBy: null,
    setCookiePatterns: [],
    cacheHeaders: {},
    securityHeaders: {},
    title: 'Example',
    metaDescription: 'Description',
    robotsMeta: null,
    canonicalUrls: ['https://example.com/'],
    h1Count: 1,
    htmlLang: 'fr',
    hasStructuredData: true,
    openGraphTags: ['og:title'],
    twitterTags: ['twitter:title'],
    detectedCmsHints: [],
    hasAnalytics: true,
    hasTagManager: true,
    hasPixel: false,
    hasCookieBanner: true,
    hasForms: true,
    internalLinks: [],
    ...overrides,
  };
}

export function buildUrlIndexabilityResult(
  overrides: Partial<UrlIndexabilityResult> = {},
): UrlIndexabilityResult {
  return {
    url: 'https://example.com/a',
    finalUrl: 'https://example.com/a',
    statusCode: 200,
    indexable: true,
    robotsMeta: null,
    xRobotsTag: null,
    canonical: 'https://example.com/a',
    canonicalCount: 1,
    title: 'Page A',
    metaDescription: 'Desc A',
    h1Count: 1,
    htmlLang: 'fr',
    error: null,
    ...overrides,
  };
}

export function buildAiBotsAccess(
  overrides: Partial<AiBotsAccess> = {},
): AiBotsAccess {
  return {
    gptBot: 'allowed',
    chatGptUser: 'allowed',
    perplexityBot: 'allowed',
    claudeBot: 'allowed',
    googleExtended: 'allowed',
    xRobotsNoAi: false,
    xRobotsNoImageAi: false,
    ...overrides,
  };
}

export function buildStructuredDataQuality(
  overrides: Partial<StructuredDataQualityResult> = {},
): StructuredDataQualityResult {
  return {
    score: 80,
    total: 2,
    types: ['Organization'],
    googleRichResultsEligible: true,
    aiFriendly: true,
    invalidBlocks: [],
    ...overrides,
  };
}

export function buildCitationWorthiness(
  overrides: Partial<CitationWorthinessScore> = {},
): CitationWorthinessScore {
  return {
    score: 75,
    hasFacts: true,
    hasSources: true,
    hasDates: true,
    hasAuthor: true,
    contentDensity: 'high',
    ...overrides,
  };
}

export function buildPageExploree(
  chemin: string,
  overrides: Partial<UrlIndexabilityResult> = {},
): UrlIndexabilityResult {
  const url = `https://example.com${chemin}`;
  return buildUrlIndexabilityResult({
    url,
    finalUrl: url,
    canonical: url,
    canonicalUrls: [url],
    https: true,
    redirectChain: [],
    robotsMeta: 'index,follow',
    openGraphTags: ['og:title'],
    twitterTags: ['twitter:card'],
    detectedCmsHints: [],
    hasAnalytics: true,
    hasTagManager: false,
    hasPixel: false,
    hasCookieBanner: true,
    internalLinks: ['https://example.com/contact'],
    ...overrides,
  });
}

export function createMockAuditRequestsRepo(): jest.Mocked<IAuditRequestsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findSummaryById: jest.fn(),
    updateState: jest.fn(),
  };
}

export function createMockAuditNotifier(): jest.Mocked<IAuditNotifierPort> {
  return {
    sendAuditNotification: jest.fn().mockResolvedValue(undefined),
    sendClientReport: jest.fn().mockResolvedValue(undefined),
    sendExpertReport: jest.fn().mockResolvedValue(undefined),
  };
}

export function createMockAuditQueue(): jest.Mocked<IAuditQueuePort> {
  return {
    enqueue: jest.fn(),
  };
}

export function buildLangchainAuditInput(
  overrides?: Partial<LangchainAuditInput>,
): LangchainAuditInput {
  return {
    locale: 'fr',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    keyChecks: { accessibility: { https: true } },
    quickWins: [
      'Ajouter des meta descriptions sur les pages cles',
      'Corriger les canonicals manquantes',
      'Reduire le TTFB des pages les plus lentes',
    ],
    pillarScores: {
      seo: 72,
      performance: 60,
      technical: 68,
      trust: 74,
      conversion: 65,
    },
    deepFindings: [
      {
        code: 'missing_meta_description',
        title: 'Meta descriptions manquantes',
        description: "Plusieurs pages n'ont pas de meta description.",
        severity: 'high',
        confidence: 0.9,
        impact: 'traffic',
        affectedUrls: ['https://example.com/a'],
        recommendation: 'Ajouter des metas uniques orientees intention.',
      },
    ],
    sampledUrls: [
      {
        url: 'https://example.com/a',
        statusCode: 200,
        indexable: true,
        canonical: 'https://example.com/a',
        title: 'Page A',
        metaDescription: null,
        h1Count: 1,
        htmlLang: 'fr',
        canonicalCount: 1,
        responseTimeMs: 1400,
        error: null,
      },
    ],
    pageRecaps: [
      {
        url: 'https://example.com/a',
        priority: 'high',
        wordingScore: 60,
        trustScore: 55,
        ctaScore: 50,
        seoCopyScore: 58,
        topIssues: ['Missing CTA'],
        recommendations: ['Add primary CTA block'],
        source: 'fallback',
      },
    ],
    pageSummary: {
      totalPages: 1,
      llmRecaps: 0,
      fallbackRecaps: 1,
      priorityCounts: { high: 1, medium: 0, low: 0 },
      averageScores: { wording: 60, trust: 55, cta: 50, seoCopy: 58 },
      topRecurringIssues: ['missing cta'],
    },
    techFingerprint: {
      primaryStack: 'WordPress',
      confidence: 0.76,
      evidence: ['WordPress hint detected on https://example.com/a'],
      alternatives: ['PHP runtime'],
      unknowns: [],
    },
    ...overrides,
  };
}

export function buildEngineScore(
  engine: EngineScore['engine'],
  overrides: Partial<EngineScore> = {},
): EngineScore {
  return {
    engine,
    score: 72,
    indexable: true,
    strengths: ['clear titles'],
    blockers: [],
    opportunities: ['add FAQ schema'],
    ...overrides,
  };
}

const MOTEUR_PAR_CLE = {
  google: 'google',
  bingChatGpt: 'bing_chatgpt',
  perplexity: 'perplexity',
  geminiOverviews: 'gemini_overviews',
} as const satisfies Record<keyof EngineCoverage, EngineScore['engine']>;

export function buildEngineCoverage(
  scores: Partial<Record<keyof EngineCoverage, number>> = {},
): EngineCoverage {
  const scoreDe = (cle: keyof EngineCoverage): EngineScore =>
    buildEngineScore(
      MOTEUR_PAR_CLE[cle],
      scores[cle] === undefined ? {} : { score: scores[cle] },
    );
  return {
    google: scoreDe('google'),
    bingChatGpt: scoreDe('bingChatGpt'),
    perplexity: scoreDe('perplexity'),
    geminiOverviews: scoreDe('geminiOverviews'),
  };
}

export function buildPageAiRecap(
  overrides: Partial<PageAiRecap> = {},
): PageAiRecap {
  return {
    url: 'https://example.com/',
    finalUrl: 'https://example.com/',
    priority: 'medium',
    language: 'fr',
    wordingScore: 70,
    trustScore: 70,
    ctaScore: 70,
    seoCopyScore: 70,
    summary: 'Recap',
    topIssues: ['Meta'],
    recommendations: ['Improve meta'],
    source: 'fallback',
    engineScores: buildEngineCoverage({
      google: 70,
      bingChatGpt: 60,
      perplexity: 50,
      geminiOverviews: 55,
    }),
    ...overrides,
  };
}

export function buildClientReportContext(
  overrides: Partial<ClientReportContext> = {},
): ClientReportContext {
  return {
    locale: 'fr',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    pillarScores: {
      seo: 62,
      performance: 55,
      technical: 70,
      trust: 68,
      conversion: 60,
      aiVisibility: 48,
      citationWorthiness: 52,
    },
    findings: [
      {
        title: 'Meta descriptions manquantes',
        description:
          'Plusieurs pages commerciales sans meta description unique.',
        severity: 'high',
        impact: 'traffic',
      },
      {
        title: 'CTA peu visible au-dessus de la ligne de flottaison',
        description:
          'CTA principal difficile a reperer en moins de 3 secondes sur mobile.',
        severity: 'medium',
        impact: 'conversion',
      },
      {
        title: 'llms.txt absent',
        description: 'Pas de fichier /llms.txt a la racine.',
        severity: 'low',
        impact: 'indexation',
      },
    ],
    quickWins: [
      'Ajouter meta descriptions orientees intention',
      'Deplacer CTA principal above-the-fold',
      'Publier llms.txt a la racine',
    ],
    aggregateAiSignals: null,
    engineCoverage: null,
    ...overrides,
  };
}

export function buildClientReportSynthesis(): ClientReportSynthesis {
  return {
    executiveSummary: 'Synthese client',
    topFindings: [],
    googleVsAiMatrix: {
      googleVisibility: { score: 80, summary: 'OK' },
      aiVisibility: { score: 40, summary: 'A ameliorer' },
    },
    pillarScorecard: [],
    quickWins: [],
    cta: { title: 'CTA', description: 'Desc', actionLabel: 'Action' },
  };
}
