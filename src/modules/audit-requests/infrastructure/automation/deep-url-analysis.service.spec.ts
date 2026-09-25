import {
  buildHomepageSnapshot,
  buildUrlIndexabilityResult,
} from '../../../../../test/factories/audit-requests.factory';
import { DeepUrlAnalysisService } from './deep-url-analysis.service';
import type { HomepageAuditSnapshot } from './homepage-analyzer.service';

describe('DeepUrlAnalysisService', () => {
  let service: DeepUrlAnalysisService;

  beforeEach(() => {
    service = new DeepUrlAnalysisService();
  });

  const accueil = (
    overrides: Partial<HomepageAuditSnapshot>,
  ): HomepageAuditSnapshot =>
    buildHomepageSnapshot({
      finalUrl: 'https://example.com',
      ttfbMs: 120,
      totalResponseMs: 420,
      contentLength: 20000,
      metaDescription: 'Example',
      robotsMeta: 'index,follow',
      canonicalUrls: ['https://example.com'],
      htmlLang: 'en',
      twitterTags: ['twitter:card'],
      internalLinks: ['https://example.com/about'],
      ...overrides,
    });

  it('detects duplicate titles and missing metadata issues', () => {
    const result = service.analyze([
      buildUrlIndexabilityResult({
        title: 'Same Title',
        metaDescription: '',
        h1Count: 2,
        htmlLang: null,
        canonical: null,
        canonicalCount: 0,
        responseTimeMs: 3000,
      }),
      buildUrlIndexabilityResult({
        url: 'https://example.com/b',
        finalUrl: 'https://example.com/b',
        indexable: false,
        title: 'Same Title',
        metaDescription: 'Meta',
        robotsMeta: 'noindex',
        canonical: 'https://example.com/b',
        responseTimeMs: 500,
      }),
    ]);
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
    const homepage = accueil({
      server: 'nginx',
      xPoweredBy: 'PHP/8.2',
      setCookiePatterns: ['wordpress_logged_in', 'phpsessid'],
      cacheHeaders: { 'cache-control': 'max-age=0' },
      securityHeaders: { 'x-frame-options': 'SAMEORIGIN' },
      detectedCmsHints: ['WordPress'],
    });
    const pages = [
      buildUrlIndexabilityResult({
        url: 'https://example.com/about',
        finalUrl: 'https://example.com/about',
        title: 'About',
        metaDescription: 'About',
        htmlLang: 'en',
        robotsMeta: 'index,follow',
        canonical: 'https://example.com/about',
        responseTimeMs: 500,
        detectedCmsHints: ['WordPress'],
        server: 'nginx',
        xPoweredBy: 'PHP/8.2',
        setCookiePatterns: ['wordpress_test_cookie'],
        cacheHeaders: {},
        securityHeaders: {},
      }),
    ];

    const fingerprint = service.inferTechFingerprint(homepage, pages, 'en');

    expect(fingerprint.primaryStack).toContain('WordPress');
    expect(fingerprint.confidence).toBeGreaterThanOrEqual(0.5);
    expect(fingerprint.evidence.length).toBeGreaterThan(0);
  });

  it('returns Not verifiable when deterministic evidence is weak', () => {
    const homepage = accueil({
      server: null,
      xPoweredBy: null,
      setCookiePatterns: [],
      cacheHeaders: {},
      securityHeaders: {},
      detectedCmsHints: [],
    });

    const fingerprint = service.inferTechFingerprint(homepage, [], 'en');

    expect(fingerprint.primaryStack).toBe('Not verifiable');
    expect(fingerprint.confidence).toBeLessThanOrEqual(0.3);
  });
});
