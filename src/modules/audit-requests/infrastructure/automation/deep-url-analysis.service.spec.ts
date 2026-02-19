import { DeepUrlAnalysisService } from './deep-url-analysis.service';
import { HomepageAuditSnapshot } from './homepage-analyzer.service';
import { UrlIndexabilityResult } from './url-indexability.service';

describe('DeepUrlAnalysisService', () => {
  let service: DeepUrlAnalysisService;

  beforeEach(() => {
    service = new DeepUrlAnalysisService();
  });

  it('detects duplicate titles and missing metadata issues', () => {
    const input: UrlIndexabilityResult[] = [
      {
        url: 'https://example.com/a',
        finalUrl: 'https://example.com/a',
        statusCode: 200,
        indexable: true,
        title: 'Same Title',
        metaDescription: '',
        h1Count: 2,
        htmlLang: null,
        robotsMeta: null,
        xRobotsTag: null,
        canonical: null,
        canonicalCount: 0,
        responseTimeMs: 3000,
        error: null,
      },
      {
        url: 'https://example.com/b',
        finalUrl: 'https://example.com/b',
        statusCode: 200,
        indexable: false,
        title: 'Same Title',
        metaDescription: 'Meta',
        h1Count: 1,
        htmlLang: 'fr',
        robotsMeta: 'noindex',
        xRobotsTag: null,
        canonical: 'https://example.com/b',
        canonicalCount: 1,
        responseTimeMs: 500,
        error: null,
      },
    ];

    const result = service.analyze(input);
    const codes = result.findings.map((finding) => finding.code);

    expect(codes).toContain('duplicate_titles');
    expect(codes).toContain('missing_meta_description');
    expect(codes).toContain('h1_structure');
    expect(codes).toContain('missing_lang');
    expect(codes).toContain('canonical_consistency');
    expect(codes).toContain('noindex_conflicts');
    expect(codes).toContain('slow_pages');
  });

  it('infers WordPress stack from deterministic CMS and cookie signatures', () => {
    const homepage: HomepageAuditSnapshot = {
      finalUrl: 'https://example.com',
      statusCode: 200,
      https: true,
      redirectChain: [],
      ttfbMs: 120,
      totalResponseMs: 420,
      contentLength: 20000,
      server: 'nginx',
      xPoweredBy: 'PHP/8.2',
      setCookiePatterns: ['wordpress_logged_in', 'phpsessid'],
      cacheHeaders: { 'cache-control': 'max-age=0' },
      securityHeaders: { 'x-frame-options': 'SAMEORIGIN' },
      title: 'Example',
      metaDescription: 'Example',
      robotsMeta: 'index,follow',
      canonicalUrls: ['https://example.com'],
      h1Count: 1,
      htmlLang: 'en',
      hasStructuredData: true,
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:card'],
      detectedCmsHints: ['WordPress'],
      hasAnalytics: true,
      hasTagManager: true,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: true,
      internalLinks: ['https://example.com/about'],
    };
    const pages: UrlIndexabilityResult[] = [
      {
        url: 'https://example.com/about',
        finalUrl: 'https://example.com/about',
        statusCode: 200,
        indexable: true,
        title: 'About',
        metaDescription: 'About',
        h1Count: 1,
        htmlLang: 'en',
        robotsMeta: 'index,follow',
        xRobotsTag: null,
        canonical: 'https://example.com/about',
        canonicalCount: 1,
        responseTimeMs: 500,
        detectedCmsHints: ['WordPress'],
        server: 'nginx',
        xPoweredBy: 'PHP/8.2',
        setCookiePatterns: ['wordpress_test_cookie'],
        cacheHeaders: {},
        securityHeaders: {},
        error: null,
      },
    ];

    const fingerprint = service.inferTechFingerprint(homepage, pages, 'en');

    expect(fingerprint.primaryStack).toContain('WordPress');
    expect(fingerprint.confidence).toBeGreaterThanOrEqual(0.5);
    expect(fingerprint.evidence.length).toBeGreaterThan(0);
  });

  it('returns Not verifiable when deterministic evidence is weak', () => {
    const homepage: HomepageAuditSnapshot = {
      finalUrl: 'https://example.com',
      statusCode: 200,
      https: true,
      redirectChain: [],
      ttfbMs: 120,
      totalResponseMs: 420,
      contentLength: 20000,
      server: null,
      xPoweredBy: null,
      setCookiePatterns: [],
      cacheHeaders: {},
      securityHeaders: {},
      title: 'Example',
      metaDescription: 'Example',
      robotsMeta: 'index,follow',
      canonicalUrls: ['https://example.com'],
      h1Count: 1,
      htmlLang: 'en',
      hasStructuredData: true,
      openGraphTags: ['og:title'],
      twitterTags: ['twitter:card'],
      detectedCmsHints: [],
      hasAnalytics: true,
      hasTagManager: true,
      hasPixel: false,
      hasCookieBanner: true,
      hasForms: true,
      internalLinks: ['https://example.com/about'],
    };

    const fingerprint = service.inferTechFingerprint(homepage, [], 'en');

    expect(fingerprint.primaryStack).toBe('Not verifiable');
    expect(fingerprint.confidence).toBeLessThanOrEqual(0.3);
  });
});
