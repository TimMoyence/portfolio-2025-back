import { cueillirDansArbre, cueillirSous, estObjet } from './ArbreDeValeurs';

describe('ArbreDeValeurs', () => {
  it('reconnaît un objet, jamais un tableau ni null', () => {
    expect(estObjet({ a: 1 })).toBe(true);
    expect(estObjet([1])).toBe(false);
    expect(estObjet(null)).toBe(false);
    expect(estObjet('texte')).toBe(false);
  });

  it('cueille les valeurs retenues à toute profondeur, tableaux compris', () => {
    const arbre = {
      image: 'a.webp',
      blocs: [{ image: 'b.webp', legende: 'x' }, { sous: { image: 'c.webp' } }],
      autre: 3,
    };

    const images = cueillirDansArbre(arbre, (cle, element) =>
      cle === 'image' && typeof element === 'string' ? [element] : null,
    );

    expect(images).toEqual(['a.webp', 'b.webp', 'c.webp']);
  });

  it('ne descend pas dans une branche déjà retenue', () => {
    const arbre = { values: [1, 2, { values: [9] }], serie: { values: [3] } };

    const nombres = cueillirDansArbre(arbre, (cle, element) =>
      cle === 'values' && Array.isArray(element)
        ? element.filter((n): n is number => typeof n === 'number')
        : null,
    );

    expect(nombres).toEqual([1, 2, 3]);
  });

  it('rend une liste vide pour une feuille non retenue', () => {
    expect(cueillirDansArbre('seul', () => ['jamais'])).toEqual([]);
  });

  const chaineSousSaCle = (cle: string, element: unknown) =>
    typeof element === 'string' ? [`${cle}:${element}`] : null;

  it('présente chaque élément d un tableau sous la clé du tableau', () => {
    const arbre = { paragraphes: ['a', 'b'], bloc: { liste: [['c'], 'd'] } };

    expect(cueillirDansArbre(arbre, chaineSousSaCle)).toEqual([
      'paragraphes:a',
      'paragraphes:b',
      'liste:c',
      'liste:d',
    ]);
  });

  it('cueille aussi la valeur rangée sous la clé donnée', () => {
    expect(cueillirSous('racine', 'seul', chaineSousSaCle)).toEqual([
      'racine:seul',
    ]);
    expect(cueillirSous('racine', { titre: 't' }, chaineSousSaCle)).toEqual([
      'titre:t',
    ]);
  });
});
