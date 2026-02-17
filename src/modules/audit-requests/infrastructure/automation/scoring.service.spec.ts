import { ScoringService } from './scoring.service';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  it('returns high scores for healthy baseline', () => {
    const homepage: HomepageAuditSnapshot = {
      finalUrl: 'https://example.com/',
      statusCode: 200,
      https: true,
      redirectChain: [],
      ttfbMs: 250,
      totalResponseMs: 700,
      contentLength: 120000,
      title: 'Example',
      metaDescription: 'Description',
      robotsMeta: null,
      canonicalUrls: ['https://example.com/'],
      h1Count: 1,
      htmlLang: 'fr',
      hasStructuredData: true,
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:title'],
      detectedCmsHints: [],
      hasAnalytics: true,
      hasTagManager: true,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: true,
    };

    const result = service.compute(
      homepage,
      ['https://example.com/sitemap.xml'],
      [],
    );
    expect(result.pillarScores.seo).toBeGreaterThanOrEqual(90);
    expect(result.quickWins.length).toBe(0);
  });

  it('adds quick wins and lowers score for major gaps', () => {
    const homepage: HomepageAuditSnapshot = {
      finalUrl: 'http://example.com/',
      statusCode: 500,
      https: false,
      redirectChain: ['http://example.com'],
      ttfbMs: 2000,
      totalResponseMs: 3500,
      contentLength: 900000,
      title: null,
      metaDescription: null,
      robotsMeta: 'noindex',
      canonicalUrls: [],
      h1Count: 0,
      htmlLang: null,
      hasStructuredData: false,
      openGraphTags: [],
      twitterTags: [],
      detectedCmsHints: [],
      hasAnalytics: false,
      hasTagManager: false,
      hasPixel: false,
      hasCookieBanner: false,
      hasForms: false,
    };

    const result = service.compute(
      homepage,
      [],
      [
        {
          url: 'https://example.com/a',
          finalUrl: 'https://example.com/a',
          statusCode: 404,
          indexable: false,
          robotsMeta: 'noindex',
          xRobotsTag: null,
          canonical: null,
          error: null,
        },
      ],
    );

    expect(result.pillarScores.technical).toBeLessThan(60);
    expect(result.quickWins.length).toBeGreaterThan(3);
  });
});
