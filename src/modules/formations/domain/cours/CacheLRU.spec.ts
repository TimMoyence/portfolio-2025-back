import { creerCacheLRU } from './CacheLRU';

describe('creerCacheLRU', () => {
  it('rend la valeur ecrite sous une cle', () => {
    const cache = creerCacheLRU<number>(2);
    cache.ecrire('a', 1);

    expect(cache.lire('a')).toBe(1);
    expect(cache.lire('b')).toBeUndefined();
  });

  it('evince la cle la moins recemment utilisee quand la capacite est atteinte', () => {
    const cache = creerCacheLRU<number>(2);
    cache.ecrire('a', 1);
    cache.ecrire('b', 2);
    cache.ecrire('c', 3);

    expect(cache.lire('a')).toBeUndefined();
    expect(cache.lire('b')).toBe(2);
    expect(cache.lire('c')).toBe(3);
  });

  it('rajeunit une cle relue avant de choisir la victime', () => {
    const cache = creerCacheLRU<number>(2);
    cache.ecrire('a', 1);
    cache.ecrire('b', 2);
    cache.lire('a');
    cache.ecrire('c', 3);

    expect(cache.lire('a')).toBe(1);
    expect(cache.lire('b')).toBeUndefined();
  });

  it('remplace la valeur d une cle deja presente sans grandir', () => {
    const cache = creerCacheLRU<number>(2);
    cache.ecrire('a', 1);
    cache.ecrire('a', 9);
    cache.ecrire('b', 2);

    expect(cache.lire('a')).toBe(9);
    expect(cache.lire('b')).toBe(2);
    expect(cache.taille).toBe(2);
  });

  it('refuse une capacite nulle ou negative', () => {
    expect(() => creerCacheLRU<number>(0)).toThrow(RangeError);
  });
});
