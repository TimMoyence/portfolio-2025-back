import {
  ecartTypePopulation,
  mediane,
  moyenne,
  moyenneOu,
  proportion,
  somme,
} from './statistiques';

describe('somme', () => {
  it('vaut zéro pour une liste vide', () => {
    expect(somme([])).toBe(0);
  });

  it('additionne les valeurs', () => {
    expect(String(somme([1, 2, 3.5]))).toBe('6.5');
  });
});

describe('moyenne', () => {
  it('divise la somme par l effectif', () => {
    expect(moyenne([2, 4, 9])).toBe(5);
  });
});

describe('moyenneOu', () => {
  it('rend la valeur de repli pour une liste vide', () => {
    expect(moyenneOu([], null)).toBeNull();
  });

  it('rend la moyenne d une liste non vide', () => {
    expect(moyenneOu([3, 5], null)).toBe(4);
  });
});

describe('proportion', () => {
  it('divise le nombre d éléments retenus par l effectif', () => {
    expect(String(proportion([1, 2, 3, 4], (valeur) => valeur > 3))).toBe(
      '0.25',
    );
  });
});

describe('mediane', () => {
  it('prend la valeur du milieu d un effectif impair, quel que soit l ordre', () => {
    expect(mediane([7, 1, 3])).toBe(3);
  });

  it('prend la moyenne des deux valeurs du milieu d un effectif pair', () => {
    expect(String(mediane([4, 1, 3, 2]))).toBe('2.5');
  });

  it('ne trie pas la liste reçue', () => {
    const valeurs: [number, ...number[]] = [7, 1, 3];

    mediane(valeurs);

    expect(valeurs).toEqual([7, 1, 3]);
  });
});

describe('ecartTypePopulation', () => {
  it('divise la somme des carrés des écarts par l effectif', () => {
    expect(ecartTypePopulation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });
});
