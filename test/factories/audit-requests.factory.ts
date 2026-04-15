import type { IAuditRequestsRepository } from '../../src/modules/audit-requests/domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../../src/modules/audit-requests/domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../../src/modules/audit-requests/domain/IAuditQueue.port';
import { AuditRequest } from '../../src/modules/audit-requests/domain/AuditRequest';
import type { AuditSnapshot } from '../../src/modules/audit-requests/domain/AuditProcessing';
import type { LangchainAuditInput } from '../../src/modules/audit-requests/infrastructure/automation/langchain-audit-report.service';

/** Construit un objet AuditRequest domaine avec des valeurs par defaut. */
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

/** Construit un AuditSnapshot avec des valeurs par defaut. */
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

/** Cree un mock complet du repository de demandes d'audit. */
export function createMockAuditRequestsRepo(): jest.Mocked<IAuditRequestsRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findSummaryById: jest.fn(),
    updateState: jest.fn(),
  };
}

/** Cree un mock du notifier d'audit. */
export function createMockAuditNotifier(): jest.Mocked<IAuditNotifierPort> {
  return {
    sendAuditNotification: jest.fn().mockResolvedValue(undefined),
    sendClientReport: jest.fn().mockResolvedValue(undefined),
    sendExpertReport: jest.fn().mockResolvedValue(undefined),
  };
}

/** Cree un mock du port de file d'attente des audits. */
export function createMockAuditQueue(): jest.Mocked<IAuditQueuePort> {
  return {
    enqueue: jest.fn(),
  };
}

/**
 * Construit un `LangchainAuditInput` avec des valeurs par defaut realistes.
 *
 * Utilise comme fixture partagee pour tous les tests touchant au pipeline
 * LangChain (service monolithique, sous-services apres split C4b, specs
 * d'integration). Override fin-grain possible via `overrides`.
 */
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
