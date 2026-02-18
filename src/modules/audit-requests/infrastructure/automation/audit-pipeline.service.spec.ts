import { AuditSnapshot } from '../../domain/AuditProcessing';
import { AuditPipelineService } from './audit-pipeline.service';
import type { AuditAutomationConfig } from './audit.config';
import { normalizeAuditUrl } from './url-normalizer.util';

jest.mock('./url-normalizer.util', () => ({
  normalizeAuditUrl: jest.fn(),
}));

describe('AuditPipelineService', () => {
  const config: AuditAutomationConfig = {
    queueEnabled: true,
    queueName: 'audit_requests',
    queueConcurrency: 1,
    queueAttempts: 1,
    queueBackoffMs: 0,
    jobTimeoutMs: 60000,
    fetchTimeoutMs: 5000,
    maxRedirects: 5,
    htmlMaxBytes: 1_000_000,
    textMaxBytes: 1_000_000,
    sitemapSampleSize: 10,
    sitemapMaxUrls: 50_000,
    sitemapAnalyzeLimit: 10,
    urlAnalyzeConcurrency: 4,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25000,
    llmRetries: 0,
    llmLanguage: 'fr',
  };

  const audit: AuditSnapshot = {
    id: 'audit-1',
    requestId: 'req-1',
    websiteName: 'example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    done: false,
    processingStatus: 'PENDING',
    progress: 0,
    step: 'Queued',
    error: null,
    normalizedUrl: null,
    finalUrl: null,
    redirectChain: [],
    keyChecks: {},
    quickWins: [],
    pillarScores: {},
    summaryText: null,
    fullReport: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    startedAt: null,
    finishedAt: null,
  };

  const homepageSnapshot = {
    finalUrl: 'https://example.com/',
    statusCode: 200,
    https: true,
    redirectChain: ['https://example.com'],
    ttfbMs: 320,
    totalResponseMs: 980,
    contentLength: 92_000,
    title: 'Accueil Example',
    metaDescription: 'Description Example',
    robotsMeta: 'index,follow',
    canonicalUrls: ['https://example.com/'],
    h1Count: 1,
    htmlLang: 'fr',
    hasStructuredData: true,
    openGraphTags: ['og:title'],
    twitterTags: ['twitter:card'],
    detectedCmsHints: ['WordPress'],
    hasAnalytics: true,
    hasTagManager: true,
    hasPixel: false,
    hasCookieBanner: true,
    hasForms: true,
    internalLinks: ['https://example.com/contact'],
  };

  const indexabilityResults = [
    {
      url: 'https://example.com/',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      indexable: true,
      title: 'Accueil Example',
      metaDescription: 'Description Example',
      h1Count: 1,
      htmlLang: 'fr',
      robotsMeta: 'index,follow',
      xRobotsTag: null,
      canonical: 'https://example.com/',
      canonicalCount: 1,
      responseTimeMs: 800,
      error: null,
    },
    {
      url: 'https://example.com/about',
      finalUrl: 'https://example.com/about',
      statusCode: 200,
      indexable: true,
      title: 'About Example',
      metaDescription: 'About Description',
      h1Count: 1,
      htmlLang: 'fr',
      robotsMeta: 'index,follow',
      xRobotsTag: null,
      canonical: 'https://example.com/about',
      canonicalCount: 1,
      responseTimeMs: 700,
      error: null,
    },
    {
      url: 'https://example.com/contact',
      finalUrl: 'https://example.com/contact',
      statusCode: 200,
      indexable: true,
      title: 'Contact Example',
      metaDescription: 'Contact Description',
      h1Count: 1,
      htmlLang: 'fr',
      robotsMeta: 'index,follow',
      xRobotsTag: null,
      canonical: 'https://example.com/contact',
      canonicalCount: 1,
      responseTimeMs: 650,
      error: null,
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('updates progress through the happy path and completes the audit', async () => {
    (normalizeAuditUrl as jest.Mock).mockResolvedValue({
      normalizedUrl: 'https://example.com/',
      hostname: 'example.com',
    });

    const repo = {
      findById: jest.fn().mockResolvedValue(audit),
      updateState: jest.fn().mockResolvedValue(undefined),
    };
    const safeFetch = {
      fetchText: jest.fn().mockResolvedValue({
        requestedUrl: 'https://example.com/',
        finalUrl: 'https://example.com/',
        redirectChain: [],
        statusCode: 200,
        headers: {},
        body: '<html></html>',
        ttfbMs: 300,
        totalMs: 900,
        contentLength: 300,
      }),
    };
    const homepageAnalyzer = {
      analyze: jest.fn().mockReturnValue(homepageSnapshot),
    };
    const sitemapDiscovery = {
      discover: jest.fn().mockResolvedValue({
        sitemapUrls: ['https://example.com/sitemap.xml'],
        urls: ['https://example.com/', 'https://example.com/about'],
      }),
    };
    const urlIndexability = {
      analyzeUrls: jest.fn().mockResolvedValue(indexabilityResults),
    };
    const scoring = {
      compute: jest
        .fn()
        .mockReturnValueOnce({
          pillarScores: {
            seo: 85,
            performance: 82,
            technical: 90,
            trust: 78,
            conversion: 80,
          },
          quickWins: ['Ajouter des données structurées avancées'],
          keyChecks: { fast: true },
        })
        .mockReturnValueOnce({
          pillarScores: {
            seo: 84,
            performance: 81,
            technical: 89,
            trust: 77,
            conversion: 79,
          },
          quickWins: ['Ajouter des données structurées avancées'],
          keyChecks: { deep: true },
        }),
    };
    const deepUrlAnalysis = {
      analyze: jest.fn().mockReturnValue({
        findings: [
          {
            code: 'meta_length_quality',
            title: 'Meta descriptions trop courtes',
            description: 'Certaines pages ont une meta trop courte',
            severity: 'medium',
            confidence: 0.8,
            impact: 'traffic',
            affectedUrls: ['https://example.com/about'],
            recommendation: 'Allonger les meta descriptions importantes',
          },
        ],
        metrics: { analyzedUrls: 3, missingMetaDescription: 0 },
      }),
    };
    const llmReport = {
      generate: jest.fn().mockResolvedValue({
        summaryText: 'Résumé complet prêt pour le client.',
        adminReport: { executiveSummary: 'Synthèse' },
      }),
    };
    const mailer = {
      sendAuditReportNotification: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuditPipelineService(
      repo as never,
      config,
      safeFetch as never,
      homepageAnalyzer as never,
      deepUrlAnalysis as never,
      sitemapDiscovery as never,
      urlIndexability as never,
      scoring as never,
      llmReport as never,
      mailer as never,
    );

    await service.run('audit-1');

    const updates = repo.updateState.mock.calls.map(
      (call: unknown[]) => call[1] as Record<string, unknown>,
    );

    expect(
      updates.some(
        (state) =>
          state.processingStatus === 'RUNNING' &&
          state.progress === 10 &&
          state.step === 'Normalisation URL' &&
          state.startedAt instanceof Date,
      ),
    ).toBe(true);
    expect(
      updates.some(
        (state) =>
          state.progress === 30 &&
          state.step === 'Diagnostic initial disponible',
      ),
    ).toBe(true);
    expect(
      updates.some(
        (state) =>
          state.progress === 60 && state.step === 'Génération du résumé',
      ),
    ).toBe(true);
    expect(
      updates.some(
        (state) =>
          state.progress === 80 &&
          state.step === 'Préparation du rapport final',
      ),
    ).toBe(true);

    const completedState = updates.find(
      (state) => state.processingStatus === 'COMPLETED',
    );
    expect(completedState).toBeDefined();
    if (completedState) {
      expect(completedState.progress).toBe(100);
      expect(completedState.done).toBe(true);
      expect(completedState.step).toBe('Audit terminé');
      expect(completedState.summaryText).toBe(
        'Résumé complet prêt pour le client.',
      );
      expect(
        completedState.fullReport !== null &&
          typeof completedState.fullReport === 'object',
      ).toBe(true);
      expect(completedState.finishedAt instanceof Date).toBe(true);
    }
    expect(mailer.sendAuditReportNotification).toHaveBeenCalledTimes(1);
  });

  it('marks the audit as failed when an exception occurs', async () => {
    (normalizeAuditUrl as jest.Mock).mockRejectedValue(
      new Error('Normalization failed'),
    );

    const repo = {
      findById: jest.fn().mockResolvedValue(audit),
      updateState: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuditPipelineService(
      repo as never,
      config,
      { fetchText: jest.fn() } as never,
      { analyze: jest.fn() } as never,
      { analyze: jest.fn() } as never,
      { discover: jest.fn() } as never,
      { analyzeUrls: jest.fn() } as never,
      { compute: jest.fn() } as never,
      { generate: jest.fn() } as never,
      { sendAuditReportNotification: jest.fn() } as never,
    );

    await service.run('audit-1');

    const lastCall = repo.updateState.mock.calls.at(-1) as
      | [string, Record<string, unknown>]
      | undefined;
    expect(lastCall).toBeDefined();
    if (lastCall) {
      expect(lastCall[0]).toBe('audit-1');
      expect(lastCall[1].processingStatus).toBe('FAILED');
      expect(lastCall[1].progress).toBe(100);
      expect(lastCall[1].step).toBe('Audit en échec');
      expect(lastCall[1].done).toBe(false);
      expect(lastCall[1].error).toBe('Normalization failed');
      expect(lastCall[1].finishedAt instanceof Date).toBe(true);
    }
  });
});
