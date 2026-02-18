import { parseSitemapXml, pickUrlSample } from './sitemap-parser.util';

describe('parseSitemapXml', () => {
  it('parses urlset', () => {
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>
`;
    const parsed = parseSitemapXml(xml, 50000);
    expect(parsed.urls).toEqual([
      'https://example.com/',
      'https://example.com/about',
    ]);
    expect(parsed.sitemapUrls).toEqual([]);
  });

  it('parses sitemap index', () => {
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
</sitemapindex>
`;
    const parsed = parseSitemapXml(xml, 50000);
    expect(parsed.urls).toEqual([]);
    expect(parsed.sitemapUrls).toEqual([
      'https://example.com/sitemap-1.xml',
      'https://example.com/sitemap-2.xml',
    ]);
  });

  it('returns empty arrays on malformed XML', () => {
    const parsed = parseSitemapXml('<broken><xml>', 50000);
    expect(parsed.urls).toEqual([]);
    expect(parsed.sitemapUrls).toEqual([]);
  });

  it('clamps parsed URLs to maxUrls', () => {
    const xml = `
<urlset>
  <url><loc>https://example.com/1</loc></url>
  <url><loc>https://example.com/2</loc></url>
  <url><loc>https://example.com/3</loc></url>
</urlset>
`;
    const parsed = parseSitemapXml(xml, 2);
    expect(parsed.urls).toEqual([
      'https://example.com/1',
      'https://example.com/2',
    ]);
  });
});

describe('pickUrlSample', () => {
  it('returns unique samples preserving a deterministic head', () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3',
      'https://example.com/4',
    ];

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    const picked = pickUrlSample(urls, 2, 3);
    randomSpy.mockRestore();

    expect(picked.sample.length).toBe(2);
    expect(new Set(picked.sample).size).toBe(2);
    expect(picked.sample[0]).toBe('https://example.com/1');
    expect(picked.deepAnalysis.length).toBe(3);
    expect(new Set(picked.deepAnalysis).size).toBe(3);
    expect(picked.deepAnalysis[0]).toBe('https://example.com/1');
  });

  it('returns all URLs when limits exceed the sitemap size', () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3',
    ];
    const picked = pickUrlSample(urls, 10, 20);
    expect(picked.sample).toEqual(urls);
    expect(picked.deepAnalysis).toEqual(urls);
  });
});
