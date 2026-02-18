import { DeepUrlAnalysisService } from './deep-url-analysis.service';
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
});
