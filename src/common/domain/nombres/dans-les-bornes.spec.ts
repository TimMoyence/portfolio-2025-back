import {
  dansLesBornes,
  estEntierDansLesBornes,
  estEntierStrictementPositif,
} from './dans-les-bornes';

describe('dansLesBornes', () => {
  const BORNES = { min: 20, max: 65 };

  it.each([
    [20, true],
    [42, true],
    [65, true],
    [19, false],
    [66, false],
    [Number.NaN, false],
  ])('situe %p par rapport à [20 ; 65] : %p', (valeur, attendu) => {
    expect(dansLesBornes(valeur, BORNES)).toBe(attendu);
  });
});

describe('estEntierDansLesBornes', () => {
  it.each<[unknown, boolean]>([
    [0, true],
    [5, true],
    [10, true],
    [1.5, false],
    ['5', false],
    [-1, false],
    [11, false],
    [Number.NaN, false],
    [null, false],
  ])('reconnaît %p comme un entier de [0 ; 10] : %p', (valeur, attendu) => {
    expect(estEntierDansLesBornes(valeur, { min: 0, max: 10 })).toBe(attendu);
  });

  it('refuse un entier au-delà de 2^53 même sans borne haute', () => {
    expect(
      estEntierDansLesBornes(Number.MAX_SAFE_INTEGER, {
        min: 0,
        max: Number.POSITIVE_INFINITY,
      }),
    ).toBe(true);
    expect(
      estEntierDansLesBornes(Number.MAX_SAFE_INTEGER + 1, {
        min: 0,
        max: Number.POSITIVE_INFINITY,
      }),
    ).toBe(false);
  });
});

describe('estEntierStrictementPositif', () => {
  it.each<[unknown, boolean]>([
    [1, true],
    [20, true],
    [0, false],
    [-1, false],
    [1.5, false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
    ['1', false],
  ])(
    'reconnaît %p comme un entier strictement positif : %p',
    (valeur, attendu) => {
      expect(estEntierStrictementPositif(valeur)).toBe(attendu);
    },
  );
});
