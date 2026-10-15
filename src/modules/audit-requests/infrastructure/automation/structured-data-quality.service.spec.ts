import { StructuredDataQualityService } from './structured-data-quality.service';

const ARTICLE_MINIMAL = {
  '@type': 'Article',
  headline: 'x',
  author: 'j',
  datePublished: '2026-01-01',
};

const FAQ = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'q',
      acceptedAnswer: { '@type': 'Answer', text: 'a' },
    },
  ],
};

const FIL_D_ARIANE = {
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x' },
  ],
};

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
    const result = service.analyze([FAQ]);
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
      { ...ARTICLE_MINIMAL, '@type': ['Article', 'NewsArticle'] },
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
      [FAQ] as unknown as Record<string, unknown>,
      ARTICLE_MINIMAL,
    ]);
    expect(result.total).toBe(1);
    expect(result.types).toEqual(['Article']);
  });

  it.each([
    [
      'valide un Product complet',
      {
        '@type': 'Product',
        name: 'Chaussure',
        image: 'https://x/y.jpg',
        offers: { '@type': 'Offer', price: 49.99, priceCurrency: 'EUR' },
      },
    ],
    ['accepte BreadcrumbList sans author (rules spécifiques)', FIL_D_ARIANE],
  ])('%s', (_titre, bloc) => {
    const result = service.analyze([bloc]);
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

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
    'lit un @type « %s » comme un type inconnu, sans planter',
    (type) => {
      expect(service.analyze([{ '@type': type }])).toMatchObject({
        total: 1,
        types: [type],
        invalidBlocks: [],
        googleRichResultsEligible: false,
      });
    },
  );

  it('lit chaque nœud d un @graph comme un bloc, à la manière de Yoast', () => {
    const result = service.analyze([
      {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: 'Accueil' },
          ARTICLE_MINIMAL,
          FIL_D_ARIANE,
        ],
      },
    ]);

    expect(result).toMatchObject({
      total: 3,
      types: ['WebPage', 'Article', 'BreadcrumbList'],
      googleRichResultsEligible: true,
      aiFriendly: true,
      invalidBlocks: [],
    });
  });

  it('lit un @graph qui vaut un seul nœud comme la forme tableau', () => {
    const result = service.analyze([
      { '@context': 'https://schema.org', '@graph': ARTICLE_MINIMAL },
    ]);

    expect(result).toMatchObject({
      total: 1,
      types: ['Article'],
      score: 85,
      malformedBlocks: 0,
    });
  });

  it('compte comme un nœud le conteneur d un @graph qui porte ses propres propriétés', () => {
    const result = service.analyze([
      {
        '@context': 'https://schema.org',
        '@id': 'https://a.fr/#graphe',
        '@graph': [ARTICLE_MINIMAL],
      },
      { '@type': 'WebSite', name: 'Site', '@graph': [FIL_D_ARIANE] },
    ]);

    expect(result).toMatchObject({
      total: 3,
      types: ['Article', 'WebSite', 'BreadcrumbList'],
      malformedBlocks: 0,
    });
  });

  it('compte comme illisible un @graph qui n est ni un nœud ni une liste', () => {
    const result = service.analyze([{ '@graph': 'texte' }]);

    expect(result).toMatchObject({ total: 0, malformedBlocks: 1 });
  });

  it('compte comme illisible une entrée qui n est pas un objet, nœud d un @graph compris', () => {
    const result = service.analyze(
      [null, 'texte', 42, { '@graph': [7, ARTICLE_MINIMAL] }],
      1,
    );

    expect(result).toMatchObject({
      total: 1,
      types: ['Article'],
      malformedBlocks: 5,
    });
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
    const result = service.analyze([ARTICLE_MINIMAL, FAQ, FIL_D_ARIANE]);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
