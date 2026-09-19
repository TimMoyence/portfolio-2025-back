import { B2_VISUAL_SNAPSHOT } from '../../../../migrations/data/b2-visual.snapshot';
import { parseVisualPresentation } from './VisualPresentation';

describe('contrat visuel du catalogue', () => {
  it('valide les 72 écrans et les 14 layouts du deck B2 extrait', () => {
    const presentations = B2_VISUAL_SNAPSHOT.map(({ renderer, props }) =>
      parseVisualPresentation({ renderer, props }),
    );
    expect(presentations).toHaveLength(72);
    expect(new Set(presentations.map((item) => item.renderer)).size).toBe(14);
  });

  it('refuse une correction glissée dans un quiz étudiant', () => {
    expect(() =>
      parseVisualPresentation({
        renderer: 'quiz',
        props: {
          questionData: {
            id: 'q1',
            type: 'quiz',
            question: 'Question ?',
            options: ['A', 'B'],
            correctIndex: 0,
          },
        },
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
