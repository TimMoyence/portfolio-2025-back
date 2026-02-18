import type { AuditAutomationConfig } from './audit.config';
import { SafeFetchService } from './safe-fetch.service';
import { SitemapDiscoveryService } from './sitemap-discovery.service';

describe('SitemapDiscoveryService', () => {
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
    sitemapAnalyzeLimit: 150,
    urlAnalyzeConcurrency: 4,
    pageAnalyzeLimit: 30,
    pageAiConcurrency: 3,
    pageAiTimeoutMs: 8000,
    llmModel: 'gpt-4o-mini',
    llmTimeoutMs: 25000,
    llmSummaryTimeoutMs: 20000,
    llmExpertTimeoutMs: 60000,
    llmRetries: 0,
    llmLanguage: 'fr',
    rateHourlyMin: 80,
    rateHourlyMax: 120,
    rateCurrency: 'EUR',
  };

  function createSafeFetchMock(
    map: Record<string, { status: number; body: string }>,
  ) {
    return {
      fetchText: jest.fn().mockImplementation((url: string) => {
        const item = map[url];
        if (!item) {
          return Promise.resolve({
            requestedUrl: url,
            finalUrl: url,
            redirectChain: [],
            statusCode: 404,
            headers: {},
            body: '',
            ttfbMs: 10,
            totalMs: 10,
            contentLength: null,
          });
        }

        return Promise.resolve({
          requestedUrl: url,
          finalUrl: url,
          redirectChain: [],
          statusCode: item.status,
          headers: {},
          body: item.body,
          ttfbMs: 10,
          totalMs: 10,
          contentLength: item.body.length,
        });
      }),
    } as unknown as SafeFetchService;
  }

  it('falls back to common sitemap paths when robots has no sitemap', async () => {
    const safeFetch = createSafeFetchMock({
      'https://example.com/robots.txt': {
        status: 200,
        body: 'User-agent: *\nDisallow: /admin',
      },
      'https://example.com/sitemap.xml': { status: 404, body: '' },
      'https://example.com/sitemap_index.xml': {
        status: 200,
        body: `
          <urlset>
            <url><loc>https://example.com/a</loc></url>
            <url><loc>https://example.com/b</loc></url>
          </urlset>
        `,
      },
    });

    const service = new SitemapDiscoveryService(config, safeFetch);
    const result = await service.discover('https://example.com');

    expect(result.urls).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
    expect(result.sitemapUrls).toContain('https://example.com/sitemap.xml');
    expect(result.sitemapUrls).toContain(
      'https://example.com/sitemap_index.xml',
    );
  });

  it('discovers nested sitemaps from robots-declared sitemap index', async () => {
    const safeFetch = createSafeFetchMock({
      'https://example.com/robots.txt': {
        status: 200,
        body: 'Sitemap: https://example.com/custom-index.xml',
      },
      'https://example.com/custom-index.xml': {
        status: 200,
        body: `
          <sitemapindex>
            <sitemap><loc>https://example.com/posts.xml</loc></sitemap>
          </sitemapindex>
        `,
      },
      'https://example.com/posts.xml': {
        status: 200,
        body: `
          <urlset>
            <url><loc>https://example.com/blog/post-1</loc></url>
          </urlset>
        `,
      },
    });

    const service = new SitemapDiscoveryService(config, safeFetch);
    const result = await service.discover('https://example.com');

    expect(result.urls).toContain('https://example.com/blog/post-1');
    expect(result.sitemapUrls).toContain(
      'https://example.com/custom-index.xml',
    );
    expect(result.sitemapUrls).toContain('https://example.com/posts.xml');
  });
});
