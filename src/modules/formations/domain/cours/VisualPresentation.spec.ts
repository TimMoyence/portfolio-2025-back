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
