import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import { AuditSnapshot } from '../../domain/AuditProcessing';
import type { IAuditRequestsRepository } from '../../domain/IAuditRequests.repository';
import type { AuditDeliveryOrchestrator } from './audit-delivery.orchestrator';
import { AuditPipelineService } from './audit-pipeline.service';
import type { AuditAutomationConfig } from './audit.config';
import type { DeepUrlAnalysisService } from './deep-url-analysis.service';
import type { HomepageAnalyzerService } from './homepage-analyzer.service';
import type {
  LangchainAuditReportService,
  LlmSynthesisProgressEvent,
} from './langchain-audit-report.service';
import type { LlmsTxtAnalyzerService } from './llms-txt-analyzer.service';
import type { PageAiRecapService } from './page-ai-recap.service';
import type { SafeFetchService } from './safe-fetch.service';
import type { ScoringService } from './scoring.service';
import type { SitemapDiscoveryService } from './sitemap-discovery.service';
import type { UrlIndexabilityService } from './url-indexability.service';
import { normalizeAuditUrl } from './url-normalizer.util';

jest.mock('./url-normalizer.util', () => ({
  normalizeAuditUrl: jest.fn(),
}));

/**
 * Fabrique les stubs minimaux pour chaque dependance concrete du pipeline.
 * Les `as unknown as jest.Mocked<T>` sont necessaires car les classes
 * possedent des membres prives non satisfiables par un objet litteral.
 */
function buildStubDeps(
  repoOverrides?: Partial<jest.Mocked<IAuditRequestsRepository>>,
) {
  const repo: jest.Mocked<IAuditRequestsRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findSummaryById: jest.fn(),
    updateState: jest.fn(),
    ...repoOverrides,
  };

  return {
    repo,
    safeFetch: {
      fetchText: jest.fn(),
      fetchHeaders: jest.fn(),
    } as unknown as jest.Mocked<SafeFetchService>,
    homepageAnalyzer: {
      analyze: jest.fn(),
    } as unknown as jest.Mocked<HomepageAnalyzerService>,
    deepUrlAnalysis: {
      analyze: jest.fn(),
      inferTechFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeepUrlAnalysisService>,
    sitemapDiscovery: {
      discover: jest.fn(),
    } as unknown as jest.Mocked<SitemapDiscoveryService>,
    urlIndexability: {
      analyzeUrls: jest.fn(),
    } as unknown as jest.Mocked<UrlIndexabilityService>,
    pageAiRecap: {
      analyzePages: jest.fn(),
    } as unknown as jest.Mocked<PageAiRecapService>,
    scoring: {
      compute: jest.fn(),
    } as unknown as jest.Mocked<ScoringService>,
    llmReport: {
      generate: jest.fn(),
    } as unknown as jest.Mocked<LangchainAuditReportService>,
    llmsTxtAnalyzer: {
      analyze: jest.fn().mockResolvedValue({
        present: false,
        url: 'https://example.com/llms.txt',
        sizeBytes: 0,
        sections: [],
        hasFullVariant: false,
        complianceScore: 0,
        issues: ['Fichier llms.txt absent'],
      }),
    } as unknown as jest.Mocked<LlmsTxtAnalyzerService>,
    deliveryOrchestrator: {
      runForAudit: jest.fn().mockResolvedValue(undefined),
      deliver: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditDeliveryOrchestrator>,
  };
}

function buildPipelineService(
  deps: ReturnType<typeof buildStubDeps>,
  pipelineConfig: AuditAutomationConfig,
): AuditPipelineService {
  return new AuditPipelineService(
    deps.repo,
    pipelineConfig,
    deps.safeFetch,
    deps.homepageAnalyzer,
    deps.deepUrlAnalysis,
    deps.sitemapDiscovery,
    deps.urlIndexability,
    deps.pageAiRecap,
    deps.scoring,
    deps.llmReport,
    deps.llmsTxtAnalyzer,
    deps.deliveryOrchestrator,
  );
}

describe('AuditPipelineService', () => {
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    sitemapAnalyzeLimit: 10,
    urlAnalyzeConcurrency: 4,
  });

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

    const repo: jest.Mocked<IAuditRequestsRepository> = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(audit),
      findSummaryById: jest.fn(),
      updateState: jest.fn().mockResolvedValue(undefined),
    };
    const safeFetch = {
      fetchText: jest.fn().mockImplementation((url: string) => {
        if (url.endsWith('/robots.txt')) {
          return Promise.resolve({
            requestedUrl: url,
            finalUrl: url,
            redirectChain: [],
            statusCode: 200,
            headers: {},
            body: 'User-agent: *\nAllow: /\n',
            ttfbMs: 50,
            totalMs: 100,
            contentLength: 30,
          });
        }
        return Promise.resolve({
          requestedUrl: url,
          finalUrl: 'https://example.com/',
          redirectChain: [],
          statusCode: 200,
          headers: {},
          body: '<html></html>',
          ttfbMs: 300,
          totalMs: 900,
          contentLength: 300,
        });
      }),
      fetchHeaders: jest.fn(),
    } as unknown as jest.Mocked<SafeFetchService>;
    const homepageAnalyzer = {
      analyze: jest.fn().mockReturnValue(homepageSnapshot),
    } as unknown as jest.Mocked<HomepageAnalyzerService>;
    const sitemapDiscovery = {
      discover: jest.fn().mockResolvedValue({
        sitemapUrls: ['https://example.com/sitemap.xml'],
        urls: ['https://example.com/', 'https://example.com/about'],
      }),
    } as unknown as jest.Mocked<SitemapDiscoveryService>;
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
    } as unknown as jest.Mocked<UrlIndexabilityService>;
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
    } as unknown as jest.Mocked<ScoringService>;
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
    } as unknown as jest.Mocked<DeepUrlAnalysisService>;
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
    } as unknown as jest.Mocked<LangchainAuditReportService>;
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
                engineScores: {
                  google: unknown;
                  bingChatGpt: unknown;
                  perplexity: unknown;
                  geminiOverviews: unknown;
                };
              },
              done: number,
              total: number,
            ) => void | Promise<void>;
          },
        ) => {
          type EngineScoreStub = {
            engine:
              | 'google'
              | 'bing_chatgpt'
              | 'perplexity'
              | 'gemini_overviews';
            score: number;
            indexable: boolean;
            strengths: string[];
            blockers: string[];
            opportunities: string[];
          };
          const recaps: Array<{
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
            engineScores: {
              google: EngineScoreStub;
              bingChatGpt: EngineScoreStub;
              perplexity: EngineScoreStub;
              geminiOverviews: EngineScoreStub;
            };
          }> = [
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
              engineScores: {
                google: {
                  engine: 'google' as const,
                  score: 60,
                  indexable: true,
                  strengths: [],
                  blockers: [],
                  opportunities: [],
                },
                bingChatGpt: {
                  engine: 'bing_chatgpt' as const,
                  score: 55,
                  indexable: true,
                  strengths: [],
                  blockers: [],
                  opportunities: [],
                },
                perplexity: {
                  engine: 'perplexity' as const,
                  score: 50,
                  indexable: true,
                  strengths: [],
                  blockers: [],
                  opportunities: [],
                },
                geminiOverviews: {
                  engine: 'gemini_overviews' as const,
                  score: 55,
                  indexable: true,
                  strengths: [],
                  blockers: [],
                  opportunities: [],
                },
              },
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
    } as unknown as jest.Mocked<PageAiRecapService>;
    const llmsTxtAnalyzer = {
      analyze: jest.fn().mockResolvedValue({
        present: true,
        url: 'https://example.com/llms.txt',
        sizeBytes: 512,
        sections: [{ title: 'Docs', links: 3 }],
        hasFullVariant: true,
        complianceScore: 80,
        issues: [],
      }),
    } as unknown as jest.Mocked<LlmsTxtAnalyzerService>;
    const deliveryOrchestrator = {
      runForAudit: jest.fn().mockResolvedValue(undefined),
      deliver: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditDeliveryOrchestrator>;

    const service = new AuditPipelineService(
      repo,
      config,
      safeFetch,
      homepageAnalyzer,
      deepUrlAnalysis,
      sitemapDiscovery,
      urlIndexability,
      pageAiRecap,
      scoring,
      llmReport,
      llmsTxtAnalyzer,
      deliveryOrchestrator,
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

    // Phase 7 — delivery orchestrator invoked once
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(deliveryOrchestrator.runForAudit).toHaveBeenCalledTimes(1);

    // Phase 3 — llms.txt analysis wired
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(llmsTxtAnalyzer.analyze).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(llmsTxtAnalyzer.analyze).toHaveBeenCalledWith('https://example.com');

    // Phase 3 — robots.txt passed to UrlIndexability

    const analyzeUrlsCall = urlIndexability.analyzeUrls.mock.calls[0];
    expect(analyzeUrlsCall[1]).toBeDefined();
    expect((analyzeUrlsCall[1] as { robotsTxt?: string }).robotsTxt).toContain(
      'User-agent',
    );

    // Phase 3 — llmsTxt result persisted in keyChecks
    const stateWithLlmsTxt = updates.find((state) => {
      const keyChecks = state.keyChecks as Record<string, unknown> | undefined;
      return keyChecks?.llmsTxt !== undefined;
    });
    expect(stateWithLlmsTxt).toBeDefined();
    if (stateWithLlmsTxt) {
      const keyChecks = stateWithLlmsTxt.keyChecks as Record<string, unknown>;
      expect((keyChecks.llmsTxt as Record<string, unknown>).present).toBe(true);
      expect(
        (keyChecks.llmsTxt as Record<string, unknown>).complianceScore,
      ).toBe(80);
    }
  });

  it('marks the audit as failed when an exception occurs', async () => {
    (normalizeAuditUrl as jest.Mock).mockRejectedValue(
      new Error('Normalization failed'),
    );

    const deps = buildStubDeps({
      findById: jest.fn().mockResolvedValue(audit),
      updateState: jest.fn().mockResolvedValue(undefined),
    });
    const service = buildPipelineService(deps, config);

    await service.run('audit-1');

    const lastCall = deps.repo.updateState.mock.calls.at(-1) as
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
    const deps = buildStubDeps();
    const service = buildPipelineService(deps, config);

    const selected = service['selectUrlsForLocale'](
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
