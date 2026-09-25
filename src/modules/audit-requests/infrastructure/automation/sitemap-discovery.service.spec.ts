import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditAutomationConfig } from './audit.config';
import { SafeFetchService } from './safe-fetch.service';
import { SitemapDiscoveryService } from './sitemap-discovery.service';

describe('SitemapDiscoveryService', () => {
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    urlAnalyzeConcurrency: 4,
  });

  function createSafeFetchMock(
    map: Record<string, { status: number; body: string }>,
  ) {
    return {
      fetchText: jest.fn().mockImplementation((url: string) => {
        const item = map[url];
        return Promise.resolve({
          requestedUrl: url,
          finalUrl: url,
          redirectChain: [],
          statusCode: item ? item.status : 404,
          headers: {},
          body: item ? item.body : '',
          ttfbMs: 10,
          totalMs: 10,
          contentLength: item ? item.body.length : null,
        });
      }),
    } as unknown as SafeFetchService;
  }

  const decouvrir = (map: Record<string, { status: number; body: string }>) =>
    new SitemapDiscoveryService(config, createSafeFetchMock(map)).discover(
      'https://example.com',
    );

  it('falls back to common sitemap paths when robots has no sitemap', async () => {
    const result = await decouvrir({
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
    const result = await decouvrir({
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

    expect(result.urls).toContain('https://example.com/blog/post-1');
    expect(result.sitemapUrls).toContain(
      'https://example.com/custom-index.xml',
    );
    expect(result.sitemapUrls).toContain('https://example.com/posts.xml');
  });
});
