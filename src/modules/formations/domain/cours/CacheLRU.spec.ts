import { creerCacheLRU } from './CacheLRU';

type Cache = ReturnType<typeof creerCacheLRU<number>>;

function cacheDeDeuxApres(
  ...ecritures: readonly (readonly [string, number])[]
): Cache {
  const cache = creerCacheLRU<number>(2);
  for (const [cle, valeur] of ecritures) {
    cache.ecrire(cle, valeur);
  }
  return cache;
}

function lectures(
  cache: Cache,
  ...cles: readonly string[]
): Record<string, number | undefined> {
  return Object.fromEntries(cles.map((cle) => [cle, cache.lire(cle)]));
}

describe('creerCacheLRU', () => {
  it('rend la valeur ecrite sous une cle', () => {
    expect(lectures(cacheDeDeuxApres(['a', 1]), 'a', 'b')).toEqual({
      a: 1,
      b: undefined,
    });
  });

  it('evince la cle la moins recemment utilisee quand la capacite est atteinte', () => {
    const cache = cacheDeDeuxApres(['a', 1], ['b', 2], ['c', 3]);

    expect(lectures(cache, 'a', 'b', 'c')).toEqual({
      a: undefined,
      b: 2,
      c: 3,
    });
  });

  it('rajeunit une cle relue avant de choisir la victime', () => {
    const cache = cacheDeDeuxApres(['a', 1], ['b', 2]);
    cache.lire('a');
    cache.ecrire('c', 3);

    expect(lectures(cache, 'a', 'b')).toEqual({ a: 1, b: undefined });
  });

  it('remplace la valeur d une cle deja presente sans grandir', () => {
    const cache = cacheDeDeuxApres(['a', 1], ['a', 9], ['b', 2]);

    expect(lectures(cache, 'a', 'b')).toEqual({ a: 9, b: 2 });
    expect(cache.taille).toBe(2);
  });

  it('refuse une capacite nulle ou negative', () => {
    expect(() => creerCacheLRU<number>(0)).toThrow(RangeError);
  });
});
