import { extractSitemapUrlsFromRobots } from './robots-sitemap-discovery.util';

describe('extractSitemapUrlsFromRobots', () => {
  it('extracts sitemap lines with mixed case', () => {
    const robots = `
User-agent: *
Disallow: /admin
Sitemap: https://example.com/sitemap.xml
sitemap: https://example.com/blog-sitemap.xml
    `;

    expect(extractSitemapUrlsFromRobots(robots)).toEqual([
      'https://example.com/sitemap.xml',
      'https://example.com/blog-sitemap.xml',
    ]);
  });

  it('ignores comments and malformed lines', () => {
    const robots = `
# Sitemap: https://bad.example/sitemap.xml
Sitemap : https://example.com/sitemap.xml
Random: value
`;

    expect(extractSitemapUrlsFromRobots(robots)).toEqual([
      'https://example.com/sitemap.xml',
    ]);
  });

  it('deduplicates duplicates', () => {
    const robots = `
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap.xml
`;

    expect(extractSitemapUrlsFromRobots(robots)).toEqual([
      'https://example.com/sitemap.xml',
    ]);
  });
});
