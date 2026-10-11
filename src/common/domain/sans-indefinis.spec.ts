import { sansIndefinis } from './sans-indefinis';

describe('sansIndefinis', () => {
  it('retire les seules cles indefinies et garde les valeurs fausses', () => {
    expect(
      sansIndefinis({ a: 1, b: undefined, c: null, d: '', e: 0, f: false }),
    ).toEqual({ a: 1, c: null, d: '', e: 0, f: false });
    expect(Object.keys(sansIndefinis({ b: undefined }))).toEqual([]);
  });
});
