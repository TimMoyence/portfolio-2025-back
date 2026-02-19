import type { AuditAutomationConfig } from './audit.config';
import { PageAiRecapService } from './page-ai-recap.service';
import { UrlIndexabilityResult } from './url-indexability.service';

describe('PageAiRecapService', () => {
  const config: AuditAutomationConfig = {
    queueEnabled: true,
    queueName: 'audit_requests',
    queueConcurrency: 1,
    queueAttempts: 1,
    queueBackoffMs: 0,
    jobTimeoutMs: 60_000,
    fetchTimeoutMs: 8_000,
    maxRedirects: 5,
    htmlMaxBytes: 1_000_000,
    textMaxBytes: 1_000_000,
    sitemapSampleSize: 10,
    sitemapMaxUrls: 50_000,
    sitemapAnalyzeLimit: 150,
    urlAnalyzeConcurrency: 6,
    pageAnalyzeLimit: 30,
    pageAiConcurrency: 3,
    pageAiTimeoutMs: 8_000,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25_000,
    llmSummaryTimeoutMs: 20_000,
    llmExpertTimeoutMs: 60_000,
    llmProfile: 'parallel_sections_v1',
    llmProfileCanaryPercent: 100,
    llmGlobalTimeoutMs: 45_000,
    llmSectionTimeoutMs: 18_000,
    llmSectionRetryMax: 1,
    llmSectionRetryMinRemainingMs: 8_000,
    llmInflightMax: 8,
    llmRetries: 0,
    llmLanguage: 'fr',
    pageAiCircuitBreakerMinSamples: 6,
    pageAiCircuitBreakerFailureRatio: 0.5,
    rateHourlyMin: 90,
    rateHourlyMax: 130,
    rateCurrency: 'EUR',
    openAiApiKey: undefined,
  };

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
        service as unknown as { analyzeSinglePage: () => Promise<unknown> },
        'analyzeSinglePage',
      )
      .mockImplementation(
        (_locale: unknown, currentPage: UrlIndexabilityResult) =>
          Promise.resolve({
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
            },
            llmAttempted: true,
            llmFailed: true,
          }),
      );

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
