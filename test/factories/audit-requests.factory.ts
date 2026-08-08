import type { ClientReportSynthesis } from '../../src/modules/audit-requests/domain/AuditReportTiers';
import type { IAuditRequestsRepository } from '../../src/modules/audit-requests/domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../../src/modules/audit-requests/domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../../src/modules/audit-requests/domain/IAuditQueue.port';
import { AuditRequest } from '../../src/modules/audit-requests/domain/AuditRequest';
import type { AuditSnapshot } from '../../src/modules/audit-requests/domain/AuditProcessing';
import type { LangchainAuditInput } from '../../src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service';

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
