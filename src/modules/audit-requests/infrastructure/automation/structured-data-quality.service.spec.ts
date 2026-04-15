import { StructuredDataQualityService } from './structured-data-quality.service';

describe('StructuredDataQualityService', () => {
  const service = new StructuredDataQualityService();

  it('valide un JSON-LD Article complet (Google Rich Results eligible)', () => {
    const jsonLd = [
      {
        '@type': 'Article',
        headline: 'Un titre',
        author: { '@type': 'Person', name: 'Jane' },
        datePublished: '2026-01-01',
        image: 'https://example.com/img.jpg',
      },
    ];
    const result = service.analyze(jsonLd);
    expect(result.googleRichResultsEligible).toBe(true);
    expect(result.aiFriendly).toBe(true);
    expect(result.types).toContain('Article');
    expect(result.score).toBeGreaterThan(70);
    expect(result.invalidBlocks).toHaveLength(0);
  });

  it('pénalise l absence totale de structured data', () => {
    const result = service.analyze([]);
    expect(result.score).toBe(0);
    expect(result.aiFriendly).toBe(false);
    expect(result.googleRichResultsEligible).toBe(false);
    expect(result.total).toBe(0);
  });

  it('boost quand FAQPage présent (AI-friendly)', () => {
    const result = service.analyze([
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'q',
            acceptedAnswer: { '@type': 'Answer', text: 'a' },
          },
        ],
      },
    ]);
    expect(result.aiFriendly).toBe(true);
    expect(result.googleRichResultsEligible).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it('boost quand HowTo présent', () => {
    const result = service.analyze([
      {
        '@type': 'HowTo',
        name: 'Faire X',
        step: [{ '@type': 'HowToStep', text: 'étape 1' }],
      },
    ]);
    expect(result.aiFriendly).toBe(true);
    expect(result.googleRichResultsEligible).toBe(true);
  });

  it('détecte un Article invalide (headline manquant)', () => {
    const result = service.analyze([
      {
        '@type': 'Article',
        author: { '@type': 'Person', name: 'Jane' },
      },
    ]);
    expect(result.invalidBlocks).toHaveLength(1);
    expect(result.invalidBlocks[0].type).toBe('Article');
    expect(result.invalidBlocks[0].missingFields).toEqual(
      expect.arrayContaining(['headline', 'datePublished']),
    );
  });

  it('gère un type inconnu (non éligible Rich Results)', () => {
    const result = service.analyze([{ '@type': 'RandomType', name: 'x' }]);
    expect(result.googleRichResultsEligible).toBe(false);
    expect(result.aiFriendly).toBe(false);
    expect(result.types).toContain('RandomType');
  });

  it('supporte @type sous forme de tableau', () => {
    const result = service.analyze([
      {
        '@type': ['Article', 'NewsArticle'],
        headline: 'x',
        author: 'j',
        datePublished: '2026-01-01',
      },
    ]);
    expect(result.types).toEqual(
      expect.arrayContaining(['Article', 'NewsArticle']),
    );
    expect(result.googleRichResultsEligible).toBe(true);
  });

  it('ignore les entrées non-objet', () => {
    const result = service.analyze([
      null as unknown as Record<string, unknown>,
      'string' as unknown as Record<string, unknown>,
      {
        '@type': 'Article',
        headline: 'x',
        author: 'j',
        datePublished: '2026-01-01',
      },
    ]);
    expect(result.total).toBe(1);
    expect(result.types).toEqual(['Article']);
  });

  it('valide un Product complet', () => {
    const result = service.analyze([
      {
        '@type': 'Product',
        name: 'Chaussure',
        image: 'https://x/y.jpg',
        offers: { '@type': 'Offer', price: 49.99, priceCurrency: 'EUR' },
      },
    ]);
    expect(result.googleRichResultsEligible).toBe(true);
    expect(result.invalidBlocks).toHaveLength(0);
  });

  it('accepte BreadcrumbList sans author (rules spécifiques)', () => {
    const result = service.analyze([
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x' },
        ],
      },
    ]);
    expect(result.googleRichResultsEligible).toBe(true);
    expect(result.invalidBlocks).toHaveLength(0);
  });

  it('gère un bloc sans @type', () => {
    const result = service.analyze([{ name: 'x' }]);
    expect(result.total).toBe(1);
    expect(result.types).toHaveLength(0);
    expect(result.googleRichResultsEligible).toBe(false);
  });

  it('gère un @type non-string (objet) sans planter', () => {
    const result = service.analyze([
      { '@type': { nested: 'bad' } } as unknown as Record<string, unknown>,
    ]);
    expect(result.total).toBe(1);
    expect(result.types).toHaveLength(0);
  });

  it('valide un Event avec champs numériques via hasValue', () => {
    const result = service.analyze([
      {
        '@type': 'Event',
        name: 'Concert',
        startDate: '2026-06-01',
        location: { '@type': 'Place', name: 'Paris' },
      },
    ]);
    expect(result.invalidBlocks).toHaveLength(0);
  });

  it('score plafonné à 100 même avec plusieurs blocs parfaits', () => {
    const result = service.analyze([
      {
        '@type': 'Article',
        headline: 'x',
        author: 'j',
        datePublished: '2026-01-01',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'q',
            acceptedAnswer: { '@type': 'Answer', text: 'a' },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x' },
        ],
      },
    ]);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
