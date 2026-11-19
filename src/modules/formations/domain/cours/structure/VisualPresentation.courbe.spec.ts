import { FIGURE_DE_COURBE_VALIDE } from '../../../../../../test/factories/formations/cours/presentation-visuelle.factory';
import { parseVisualPresentation } from './VisualPresentation';

const leconAvecZone = (from: number, to: number) => ({
  renderer: 'lesson',
  props: {
    title: 'Le sommet ou le bord',
    blocks: [
      {
        kind: 'definition',
        title: 'Extremum',
        text: 'Le maximum se lit au sommet ou au bord.',
      },
    ],
    figure: {
      ...FIGURE_DE_COURBE_VALIDE,
      zone: { from, to, label: 'zone permise' },
    },
  },
});

describe('zone permise d une figure de courbe (RET-04)', () => {
  it('RET-04 · sert une zone qui va de gauche à droite jusqu au bord de l axe', () => {
    expect(() => parseVisualPresentation(leconAvecZone(2, 6))).not.toThrow();
  });

  it.each([
    ['inversée', 5, 2],
    ['vide', 3, 3],
  ])('RET-04 · refuse une zone %s', (_cas, from, to) => {
    expect(() => parseVisualPresentation(leconAvecZone(from, to))).toThrow(
      /zone : du début à la fin, de gauche à droite/,
    );
  });
});
