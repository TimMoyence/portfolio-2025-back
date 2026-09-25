import {
  buildQuizAffiche,
  PRESENTATIONS_VISUELLES_VALIDES,
} from '../../../../../test/factories/presentation-visuelle.factory';
import { parseVisualPresentation } from './VisualPresentation';

describe('contrat visuel du catalogue', () => {
  it.each(Object.entries(PRESENTATIONS_VISUELLES_VALIDES))(
    'valide un écran de rendu %s',
    (renderer, props) => {
      expect(parseVisualPresentation({ renderer, props })).toEqual({
        renderer,
        props,
      });
    },
  );

  it('L4 · couvre chacun des dix-sept rendus du deck, corrections de tri et de réponses comprises', () => {
    expect(Object.keys(PRESENTATIONS_VISUELLES_VALIDES)).toHaveLength(17);
  });

  describe('boîte à moustaches (B2-02)', () => {
    const boite = PRESENTATIONS_VISUELLES_VALIDES.boxplot;
    const [premiere] = boite.series as Record<string, unknown>[];
    const avecSerie = (alteration: Record<string, unknown>) => ({
      renderer: 'boxplot',
      props: { ...boite, series: [{ ...premiere, ...alteration }] },
    });

    it.each([
      ['un premier quartile sous le minimum', { q1: 20 }],
      ['une médiane au-delà du troisième quartile', { median: 60 }],
      ['un maximum sous le troisième quartile', { max: 50 }],
      ['un maximum hors de l axe', { max: 200 }],
      ['un minimum hors de l axe', { min: -5 }],
    ])('refuse %s', (_cas, alteration) => {
      expect(() => parseVisualPresentation(avecSerie(alteration))).toThrow();
    });

    it('refuse une moyenne hors de l étendue', () => {
      expect(() => parseVisualPresentation(avecSerie({ mean: 90 }))).toThrow();
    });

    it('exige une description pour les lecteurs d écran', () => {
      expect(() =>
        parseVisualPresentation({
          renderer: 'boxplot',
          props: { ...boite, description: undefined },
        }),
      ).toThrow();
    });

    it('refuse un axe inversé', () => {
      expect(() =>
        parseVisualPresentation({
          renderer: 'boxplot',
          props: { ...boite, axisRange: [160, 0] },
        }),
      ).toThrow();
    });
  });

  it('refuse une correction de réponses sans explication', () => {
    expect(() =>
      parseVisualPresentation({
        renderer: 'answer-review',
        props: {
          ...PRESENTATIONS_VISUELLES_VALIDES['answer-review'],
          explications: [],
        },
      }),
    ).toThrow();
  });

  it('refuse une correction de réponses sans écran source', () => {
    expect(() =>
      parseVisualPresentation({
        renderer: 'answer-review',
        props: {
          ...PRESENTATIONS_VISUELLES_VALIDES['answer-review'],
          source: undefined,
        },
      }),
    ).toThrow();
  });

  it.each([
    ['rangée dans une catégorie absente', { category: 'inconnue' }],
    ['portant une clé inconnue', { intrus: true }],
  ])('L4 · refuse une carte corrigée %s', (_cas, alteration) => {
    const correction = PRESENTATIONS_VISUELLES_VALIDES['sort-review'];
    const [premiere, ...suite] = correction.cards as Record<string, unknown>[];

    expect(() =>
      parseVisualPresentation({
        renderer: 'sort-review',
        props: {
          ...correction,
          cards: [{ ...premiere, ...alteration }, ...suite],
        },
      }),
    ).toThrow();
  });

  it('refuse un rendu inconnu', () => {
    expect(() =>
      parseVisualPresentation({ renderer: 'carrousel', props: {} }),
    ).toThrow();
  });

  it('refuse une correction glissée dans un quiz étudiant', () => {
    expect(() =>
      parseVisualPresentation({
        renderer: 'quiz',
        props: { questionData: buildQuizAffiche({ correctIndex: 0 }) },
      }),
    ).toThrow();
  });

  describe('médias du même domaine (B14)', () => {
    const imageADroite = (image: string) => ({
      renderer: 'image-right',
      props: { ...PRESENTATIONS_VISUELLES_VALIDES['image-right'], image },
    });

    it.each([
      '/assets/cours/b2-01/v3/playfair-ecosse-1786.webp',
      '/assets/cours/b2-01/v3/pacioli-1495.webp',
      'https://upload.wikimedia.org/wikipedia/commons/1/17/Nightingale-mortality.jpg',
    ])('accepte l image %s', (image) => {
      expect(() => parseVisualPresentation(imageADroite(image))).not.toThrow();
    });

    it.each([
      'http://images.example.test/illustration.jpeg',
      'javascript:alert(1)',
      '/assets/cours/b2-01/v3/../../secret.webp',
      '/assets/cours/b2-01/v3/image.gif',
      '/assets/cours/B2-01/v3/image.webp',
      '/assets/autre/b2-01/v3/image.webp',
      'assets/cours/b2-01/v3/image.webp',
    ])('refuse l image %s', (image) => {
      expect(() => parseVisualPresentation(imageADroite(image))).toThrow();
    });

    it('applique la même règle au fond d un écran d accroche', () => {
      expect(() =>
        parseVisualPresentation({
          renderer: 'hero',
          props: {
            ...PRESENTATIONS_VISUELLES_VALIDES.hero,
            bgImage: 'data:image/png;base64,AAAA',
          },
        }),
      ).toThrow();
    });
  });

  describe('extensions de la V3 (B29)', () => {
    it('accepte la description textuelle d un graphique et la grille imprimable', () => {
      const graphique = {
        renderer: 'chart',
        props: {
          ...PRESENTATIONS_VISUELLES_VALIDES.chart,
          description: 'Diagramme en barres : CA de 120 puis 138.',
        },
      };
      const grille = {
        renderer: 'grid',
        props: { ...PRESENTATIONS_VISUELLES_VALIDES.grid, imprimable: true },
      };

      expect(parseVisualPresentation(graphique)).toEqual(graphique);
      expect(parseVisualPresentation(grille)).toEqual(grille);
    });

    it('refuse une description vide', () => {
      expect(() =>
        parseVisualPresentation({
          renderer: 'chart',
          props: { ...PRESENTATIONS_VISUELLES_VALIDES.chart, description: '' },
        }),
      ).toThrow();
    });
  });

  it('refuse une série graphique sans valeurs', () => {
    expect(() =>
      parseVisualPresentation({
        renderer: 'chart',
        props: {
          title: 'Graphique',
          labels: ['2024'],
          series: [{ label: 'CA', values: [] }],
        },
      }),
    ).toThrow();
  });
});
