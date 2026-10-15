import { estEntierPositif } from './est-entier-positif';

describe('estEntierPositif', () => {
  it('accepte zéro et un entier positif sûr', () => {
    expect(estEntierPositif(0)).toBe(true);
    expect(estEntierPositif(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it.each([-1, 1.5, 2 ** 53, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuse %p',
    (valeur) => {
      expect(estEntierPositif(valeur)).toBe(false);
    },
  );
});
