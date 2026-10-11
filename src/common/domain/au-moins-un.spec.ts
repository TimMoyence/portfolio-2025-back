import { estAuMoinsUn, exigerAuMoinsUn, mapperAuMoinsUn } from './au-moins-un';

describe('estAuMoinsUn', () => {
  it('refuse une liste vide', () => {
    expect(estAuMoinsUn([])).toBe(false);
  });

  it('reconnaît une liste d au moins un élément', () => {
    expect(estAuMoinsUn([0])).toBe(true);
  });
});

describe('exigerAuMoinsUn', () => {
  it('rend une copie d une liste non vide', () => {
    const liste = [1, 2];

    const exigee = exigerAuMoinsUn(liste, 'liste vide');

    expect(exigee).toEqual([1, 2]);
    expect(exigee).not.toBe(liste);
  });

  it('refuse une liste vide avec le message fourni', () => {
    expect(() => exigerAuMoinsUn([], 'aucun attendu')).toThrow(
      new RangeError('aucun attendu'),
    );
  });
});

describe('mapperAuMoinsUn', () => {
  it('transforme chaque élément avec son rang, dans l ordre', () => {
    expect(
      mapperAuMoinsUn(['a', 'b', 'c'], (element, rang) => `${rang}:${element}`),
    ).toEqual(['0:a', '1:b', '2:c']);
  });
});
