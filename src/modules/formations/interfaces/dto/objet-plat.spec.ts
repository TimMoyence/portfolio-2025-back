import { entreesBornees } from './objet-plat';

describe('entreesBornees', () => {
  it('rend les entrees d un objet plat sous le plafond', () => {
    expect(entreesBornees({ B2: 'x', B3: 4 }, 2)).toEqual([
      ['B2', 'x'],
      ['B3', 4],
    ]);
  });

  it('refuse un objet qui depasse le plafond d entrees', () => {
    expect(entreesBornees({ a: 1, b: 2, c: 3 }, 2)).toBeNull();
  });

  it.each([
    ['null', null],
    ['un tableau', ['a']],
    ['un texte', 'a'],
    ['un nombre', 3],
  ])('refuse %s', (_cas, valeur) => {
    expect(entreesBornees(valeur, 10)).toBeNull();
  });
});
