import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditAutomationConfig } from './audit.config';
import { PageAiRecapService } from './page-ai-recap.service';
import { UrlIndexabilityResult } from './url-indexability.service';

describe('PageAiRecapService', () => {
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    fetchTimeoutMs: 8_000,
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    openAiApiKey: undefined,
  });

  const page: UrlIndexabilityResult = {
    url: 'https://example.com/about',
    finalUrl: 'https://example.com/about',
    statusCode: 200,
    https: true,
    redirectChain: [],
    ttfbMs: 120,
    totalResponseMs: 560,
    contentLength: 32000,
    indexable: true,
    title: 'About us',
    metaDescription: 'Learn more about our services.',
    h1Count: 1,
    h1Texts: ['About us'],
    htmlLang: 'en',
    robotsMeta: 'index,follow',
    xRobotsTag: null,
    canonical: 'https://example.com/about',
    canonicalUrls: ['https://example.com/about'],
    canonicalCount: 1,
    responseTimeMs: 560,
    wordCount: 210,
    hasStructuredData: false,
    openGraphTags: ['og:title'],
    openGraphTagCount: 1,
    twitterTags: ['twitter:title'],
    detectedCmsHints: [],
    hasAnalytics: true,
    hasTagManager: false,
    hasPixel: false,
    hasCookieBanner: true,
    hasForms: false,
    ctaHints: [],
    textExcerpt:
      'We help businesses grow through technical SEO and conversion design.',
    internalLinks: ['https://example.com/contact'],
    internalLinkCount: 1,
    error: null,
  };

  it('returns deterministic fallback when llm is unavailable', async () => {
    const service = new PageAiRecapService(config);
    const result = await service.analyzePages({
      locale: 'en',
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages: [page],
    });

    expect(result.recaps).toHaveLength(1);
    expect(result.recaps[0].source).toBe('fallback');
    expect(result.summary.totalPages).toBe(1);
    expect(result.summary.fallbackRecaps).toBe(1);
    expect(result.summary.llmRecaps).toBe(0);
  });

  it('produces a deterministic engineScores coverage in fallback mode', async () => {
    const service = new PageAiRecapService(config);
    const result = await service.analyzePages({
      locale: 'en',
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages: [
        {
          ...page,
          aiSignals: {
            llmsTxt: null,
            aiBotsAccess: {
              gptBot: 'allowed',
              chatGptUser: 'allowed',
              perplexityBot: 'allowed',
              claudeBot: 'allowed',
              googleExtended: 'allowed',
              xRobotsNoAi: false,
              xRobotsNoImageAi: false,
            },
            citationWorthiness: {
              score: 72,
              hasFacts: true,
              hasSources: true,
              hasDates: true,
              hasAuthor: true,
              contentDensity: 'high',
            },
            structuredDataQuality: {
              score: 80,
              total: 2,
              types: ['Organization', 'FAQPage'],
              googleRichResultsEligible: true,
              aiFriendly: true,
              invalidBlocks: [],
            },
          },
        },
      ],
    });

    const recap = result.recaps[0];
    expect(recap.engineScores).toBeDefined();
    expect(recap.engineScores.google.engine).toBe('google');
    expect(recap.engineScores.bingChatGpt.engine).toBe('bing_chatgpt');
    expect(recap.engineScores.perplexity.engine).toBe('perplexity');
    expect(recap.engineScores.geminiOverviews.engine).toBe('gemini_overviews');
    expect(recap.engineScores.google.score).toBeGreaterThanOrEqual(0);
    expect(recap.engineScores.google.score).toBeLessThanOrEqual(100);
    expect(recap.engineScores.google.indexable).toBe(true);
    expect(recap.engineScores.geminiOverviews.strengths.length).toBeGreaterThan(
      0,
    );
  });

  it('flags blocked bots and non-indexable pages in the engineScores fallback', async () => {
    const service = new PageAiRecapService(config);
    const result = await service.analyzePages({
      locale: 'fr',
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages: [
        {
          ...page,
          indexable: false,
          aiSignals: {
            llmsTxt: null,
            aiBotsAccess: {
              gptBot: 'disallowed',
              chatGptUser: 'disallowed',
              perplexityBot: 'disallowed',
              claudeBot: 'disallowed',
              googleExtended: 'disallowed',
              xRobotsNoAi: true,
              xRobotsNoImageAi: false,
            },
            citationWorthiness: {
              score: 20,
              hasFacts: false,
              hasSources: false,
              hasDates: false,
              hasAuthor: false,
              contentDensity: 'low',
            },
            structuredDataQuality: {
              score: 10,
              total: 0,
              types: [],
              googleRichResultsEligible: false,
              aiFriendly: false,
              invalidBlocks: [],
            },
          },
        },
      ],
    });

    const coverage = result.recaps[0].engineScores;
    expect(coverage.google.indexable).toBe(false);
    expect(coverage.bingChatGpt.indexable).toBe(false);
    expect(coverage.perplexity.indexable).toBe(false);
    expect(coverage.geminiOverviews.indexable).toBe(false);
    expect(coverage.bingChatGpt.blockers.length).toBeGreaterThan(0);
    expect(coverage.perplexity.blockers.length).toBeGreaterThan(0);
  });

  it('opens circuit breaker and skips remaining llm page calls on repeated failures', async () => {
    const service = new PageAiRecapService({
      ...config,
      openAiApiKey: 'test-key',
      pageAiCircuitBreakerMinSamples: 2,
      pageAiCircuitBreakerFailureRatio: 0.5,
      pageAiConcurrency: 1,
    });
    const pages = Array.from({ length: 5 }, (_, index) => ({
      ...page,
      url: `https://example.com/page-${index + 1}`,
      finalUrl: `https://example.com/page-${index + 1}`,
    }));

    const analyzeSpy = jest
      .spyOn(
        service as unknown as {
          analyzeSinglePage: (
            locale: unknown,
            currentPage: UrlIndexabilityResult,
            llm: unknown,
          ) => Promise<unknown>;
        },
        'analyzeSinglePage',
      )
      .mockImplementation((_locale, currentPage) => {
        const emptyEngine = {
          engine: 'google' as const,
          score: 0,
          indexable: false,
          strengths: [],
          blockers: [],
          opportunities: [],
        };
        return Promise.resolve({
          recap: {
            url: currentPage.url,
            finalUrl: currentPage.finalUrl,
            priority: 'high',
            language: 'en',
            wordingScore: 30,
            trustScore: 30,
            ctaScore: 30,
            seoCopyScore: 30,
            summary: 'fallback',
            topIssues: ['timeout'],
            recommendations: ['retry later'],
            source: 'fallback',
            engineScores: {
              google: emptyEngine,
              bingChatGpt: { ...emptyEngine, engine: 'bing_chatgpt' },
              perplexity: { ...emptyEngine, engine: 'perplexity' },
              geminiOverviews: { ...emptyEngine, engine: 'gemini_overviews' },
            },
          },
          llmAttempted: true,
          llmFailed: true,
        });
      });

    const result = await service.analyzePages({
      locale: 'en',
      websiteName: 'example.com',
      normalizedUrl: 'https://example.com',
      pages,
    });

    expect(analyzeSpy).toHaveBeenCalledTimes(2);
    expect(
      result.warnings.some((warning) =>
        warning.toLowerCase().includes('circuit breaker opened'),
      ),
    ).toBe(true);
    expect(result.recaps).toHaveLength(5);
    expect(result.summary.fallbackRecaps).toBe(5);
  });
});
