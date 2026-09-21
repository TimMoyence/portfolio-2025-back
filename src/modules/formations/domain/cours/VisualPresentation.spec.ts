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

  it('couvre chacun des quatorze rendus du deck', () => {
    expect(Object.keys(PRESENTATIONS_VISUELLES_VALIDES)).toHaveLength(14);
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
