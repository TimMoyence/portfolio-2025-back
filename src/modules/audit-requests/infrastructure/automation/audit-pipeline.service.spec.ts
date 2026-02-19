import { AuditSnapshot } from '../../domain/AuditProcessing';
import { AuditPipelineService } from './audit-pipeline.service';
import type { AuditAutomationConfig } from './audit.config';
import type { LlmSynthesisProgressEvent } from './langchain-audit-report.service';
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
    pageAnalyzeLimit: 30,
    pageAiConcurrency: 3,
    pageAiTimeoutMs: 8000,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25000,
    llmSummaryTimeoutMs: 20000,
    llmExpertTimeoutMs: 60000,
    llmProfile: 'parallel_sections_v1',
    llmProfileCanaryPercent: 100,
    llmGlobalTimeoutMs: 45000,
    llmSectionTimeoutMs: 18000,
    llmSectionRetryMax: 1,
    llmSectionRetryMinRemainingMs: 8000,
    llmInflightMax: 8,
    llmRetries: 0,
    llmLanguage: 'fr',
    pageAiCircuitBreakerMinSamples: 6,
    pageAiCircuitBreakerFailureRatio: 0.5,
    rateHourlyMin: 80,
    rateHourlyMax: 120,
    rateCurrency: 'EUR',
  };

  const audit: AuditSnapshot = {
    id: 'audit-1',
    requestId: 'req-1',
    websiteName: 'example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    locale: 'fr',
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
      canonicalUrls: ['https://example.com/'],
      canonicalCount: 1,
      https: true,
      redirectChain: [],
      ttfbMs: 220,
      totalResponseMs: 800,
      contentLength: 15000,
      responseTimeMs: 800,
      h1Texts: ['Accueil'],
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:card'],
      detectedCmsHints: [],
      hasAnalytics: true,
      hasTagManager: false,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: true,
      ctaHints: ['Contact'],
      textExcerpt: 'Bienvenue',
      internalLinks: ['https://example.com/contact'],
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
      canonicalUrls: ['https://example.com/about'],
      canonicalCount: 1,
      https: true,
      redirectChain: [],
      ttfbMs: 210,
      totalResponseMs: 700,
      contentLength: 14000,
      responseTimeMs: 700,
      h1Texts: ['About'],
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:card'],
      detectedCmsHints: [],
      hasAnalytics: true,
      hasTagManager: false,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: false,
      ctaHints: [],
      textExcerpt: 'About us',
      internalLinks: ['https://example.com/contact'],
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
      canonicalUrls: ['https://example.com/contact'],
      canonicalCount: 1,
      https: true,
      redirectChain: [],
      ttfbMs: 205,
      totalResponseMs: 650,
      contentLength: 12000,
      responseTimeMs: 650,
      h1Texts: ['Contact'],
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:card'],
      detectedCmsHints: [],
      hasAnalytics: true,
      hasTagManager: false,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: true,
      ctaHints: ['Send'],
      textExcerpt: 'Contact page',
      internalLinks: ['https://example.com/'],
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
      analyzeUrls: jest.fn().mockImplementation(
        async (
          _urls,
          options?: {
            onUrlAnalyzed?: (
              result: { url: string },
              done: number,
              total: number,
            ) => void | Promise<void>;
          },
        ) => {
          const total = indexabilityResults.length;
          for (let i = 0; i < indexabilityResults.length; i += 1) {
            if (options?.onUrlAnalyzed) {
              await options.onUrlAnalyzed(indexabilityResults[i], i + 1, total);
            }
          }
          return indexabilityResults;
        },
      ),
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
      inferTechFingerprint: jest.fn().mockReturnValue({
        primaryStack: 'WordPress',
        confidence: 0.74,
        evidence: ['WordPress hint detected'],
        alternatives: ['PHP runtime'],
        unknowns: [],
      }),
    };
    const llmReport = {
      generate: jest.fn().mockImplementation(
        async (
          _input,
          options?: {
            onProgress?: (
              event: LlmSynthesisProgressEvent,
            ) => void | Promise<void>;
          },
        ) => {
          if (options?.onProgress) {
            await options.onProgress({
              section: 'summary',
              sectionStatus: 'completed',
              iaSubTask: 'summary_generation',
            });
            await options.onProgress({
              section: 'prioritySection',
              sectionStatus: 'started',
              iaSubTask: 'prioritySection',
            });
            await options.onProgress({
              section: 'prioritySection',
              sectionStatus: 'completed',
              iaSubTask: 'prioritySection',
            });
          }
          return {
            summaryText: 'Résumé complet prêt pour le client.',
            adminReport: {
              executiveSummary: 'Synthèse',
              qualityGate: {
                fallback: true,
              },
            },
          };
        },
      ),
    };
    const pageAiRecap = {
      analyzePages: jest.fn().mockImplementation(
        async (
          _input,
          options?: {
            onRecapReady?: (
              recap: {
                url: string;
                finalUrl: string;
                priority: 'high' | 'medium' | 'low';
                language: 'fr' | 'en' | 'mixed' | 'unknown';
                wordingScore: number;
                trustScore: number;
                ctaScore: number;
                seoCopyScore: number;
                summary: string;
                topIssues: string[];
                recommendations: string[];
                source: 'llm' | 'fallback';
              },
              done: number,
              total: number,
            ) => void | Promise<void>;
          },
        ) => {
          const recaps = [
            {
              url: 'https://example.com/',
              finalUrl: 'https://example.com/',
              priority: 'medium',
              language: 'fr',
              wordingScore: 70,
              trustScore: 68,
              ctaScore: 72,
              seoCopyScore: 74,
              summary: 'Recap',
              topIssues: ['Meta'],
              recommendations: ['Improve meta'],
              source: 'fallback',
            },
          ];
          if (options?.onRecapReady) {
            await options.onRecapReady(recaps[0], 1, 1);
          }
          return {
            recaps,
            summary: {
              totalPages: 1,
              llmRecaps: 0,
              fallbackRecaps: 1,
              priorityCounts: { high: 0, medium: 1, low: 0 },
              averageScores: { wording: 70, trust: 68, cta: 72, seoCopy: 74 },
              topRecurringIssues: ['meta'],
            },
            warnings: [],
          };
        },
      ),
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
      pageAiRecap as never,
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
          state.progress === 20 && state.step === 'Baseline homepage terminee',
      ),
    ).toBe(true);
    expect(
      updates.some((state) => {
        const keyChecks = state.keyChecks as
          | Record<string, unknown>
          | undefined;
        const details = keyChecks?.progressDetails as
          | Record<string, unknown>
          | undefined;
        return (
          details?.phase === 'technical_pages' &&
          details?.iaTask === 'technical_scan' &&
          typeof details?.currentUrl === 'string'
        );
      }),
    ).toBe(true);
    const completedState = updates.find(
      (state) => state.processingStatus === 'COMPLETED',
    );
    expect(completedState).toBeDefined();
    if (completedState) {
      expect(completedState.progress).toBe(100);
      expect(completedState.done).toBe(true);
      expect(completedState.step).toBe('Audit termine');
      expect(completedState.summaryText).toBe(
        'Résumé complet prêt pour le client.',
      );
      expect(
        completedState.fullReport !== null &&
          typeof completedState.fullReport === 'object',
      ).toBe(true);
      expect(
        (
          (completedState.fullReport as Record<string, unknown>)[
            'llm'
          ] as Record<string, unknown>
        )['qualityGate'],
      ).toEqual({ fallback: true });
      expect(completedState.finishedAt instanceof Date).toBe(true);
    }
    expect(
      updates.some(
        (state) => state.processingStatus === 'RUNNING' && state.summaryText,
      ),
    ).toBe(false);
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
      { analyzePages: jest.fn() } as never,
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
      expect(lastCall[1].step).toBe('Audit en echec');
      expect(lastCall[1].done).toBe(false);
      expect(lastCall[1].error).toBe('Normalization failed');
      expect(lastCall[1].finishedAt instanceof Date).toBe(true);
    }
  });

  it('selects locale-first urls before neutral and alternate locale urls', () => {
    const service = new AuditPipelineService(
      { findById: jest.fn(), updateState: jest.fn() } as never,
      config,
      { fetchText: jest.fn() } as never,
      { analyze: jest.fn() } as never,
      { analyze: jest.fn() } as never,
      { discover: jest.fn() } as never,
      { analyzeUrls: jest.fn() } as never,
      { analyzePages: jest.fn() } as never,
      { compute: jest.fn() } as never,
      { generate: jest.fn() } as never,
      { sendAuditReportNotification: jest.fn() } as never,
    );

    const serviceWithSelector = service as unknown as {
      selectUrlsForLocale: (
        candidateUrls: string[],
        homepageUrl: string,
        locale: 'fr' | 'en',
        limit: number,
      ) => string[];
    };

    const selected = serviceWithSelector.selectUrlsForLocale(
      [
        'https://example.com/en/home',
        'https://example.com/fr/services',
        'https://example.com/about',
        'https://example.com/en/contact',
        'https://example.com/fr/contact',
      ],
      'https://example.com/fr/home',
      'fr',
      5,
    );

    const firstEnglishIndex = selected.findIndex((url) => /\/en\//.test(url));
    const lastFrenchIndex = selected.reduce<number>(
      (index, url, cursor) => (/\/fr\//.test(url) ? cursor : index),
      -1,
    );

    expect(selected[0]).toContain('/fr/');
    expect(lastFrenchIndex).toBeGreaterThanOrEqual(0);
    expect(firstEnglishIndex).toBeGreaterThan(lastFrenchIndex);
  });
});
