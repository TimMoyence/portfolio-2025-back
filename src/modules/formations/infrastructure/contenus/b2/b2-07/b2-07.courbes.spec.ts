import { tangenteEn, tracer } from './b2-07.courbes';

const COLLINE = {
  f: (x: number) => -x * x + 6 * x,
  derivee: (x: number) => -2 * x + 6,
};

describe('tracer', () => {
  it('RET-03 · échantillonne la colline de x = 0 à x = 6, pas de 1', () => {
    expect(tracer(COLLINE, [0, 6], 1)).toEqual(
      [0, 5, 8, 9, 8, 5, 0].map((y, x) => ({ x, y })),
    );
  });

  it('arrondit chaque point au centième, sans décaler les abscisses', () => {
    const capital = {
      f: (x: number) => 1000 * Math.exp(0.02 * x),
      derivee: (x: number) => 20 * Math.exp(0.02 * x),
    };

    expect(tracer(capital, [0, 0.3], 0.1)).toEqual([
      { x: 0, y: 1000 },
      { x: 0.1, y: 1002 },
      { x: 0.2, y: 1004.01 },
      { x: 0.3, y: 1006.02 },
    ]);
  });
});

describe('tangenteEn', () => {
  it.each([
    [1, 5, 4],
    [2, 8, 2],
    [3, 9, 0],
    [4, 8, -2],
    [5, 5, -4],
  ])(
    'RET-03 · en x = %i, sert le point (x ; %i) et la pente %i',
    (x, y, slope) => {
      expect(tangenteEn(COLLINE, x)).toEqual({ x, y, slope });
    },
  );

  it('porte l’étiquette qu’on lui donne', () => {
    expect(tangenteEn(COLLINE, 3, 'sommet')).toEqual({
      x: 3,
      y: 9,
      slope: 0,
      label: 'sommet',
    });
  });
});
