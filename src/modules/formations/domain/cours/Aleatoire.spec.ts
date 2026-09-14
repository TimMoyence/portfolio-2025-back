import { creerRng, creerTirage, melanger } from './Aleatoire';

describe('creerRng', () => {
  it('rend la meme suite que le generateur du front pour la meme graine', () => {
    const rng = creerRng(42);
    expect([rng(), rng(), rng()]).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
    ]);
  });

  it('rend deux suites identiques pour deux generateurs de meme graine', () => {
    const a = creerRng(1001);
    const b = creerRng(1001);
    expect(Array.from({ length: 20 }, () => a())).toEqual(
      Array.from({ length: 20 }, () => b()),
    );
  });
});

describe('melanger', () => {
  it('rend une permutation sans toucher la source', () => {
    const source = ['a', 'b', 'c', 'd', 'e'] as const;
    const melange = melanger(source, creerRng(7));
    expect([...melange].sort((a, b) => (a < b ? -1 : 1))).toEqual([...source]);
    expect(source).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('rend le meme ordre pour la meme graine', () => {
    const source = [1, 2, 3, 4, 5, 6];
    expect(melanger(source, creerRng(3))).toEqual(
      melanger(source, creerRng(3)),
    );
  });
});

describe('creerTirage', () => {
  it('tire un entier dans les bornes incluses et atteint les deux bornes', () => {
    const tirage = creerTirage(creerRng(11));
    const vus = new Set(Array.from({ length: 500 }, () => tirage.entier(1, 3)));
    expect([...vus].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('tire un decimal multiple du pas', () => {
    const tirage = creerTirage(creerRng(5));
    for (let i = 0; i < 200; i += 1) {
      const valeur = tirage.decimal(1, 2, 0.1);
      expect(valeur).toBeGreaterThanOrEqual(1);
      expect(valeur).toBeLessThanOrEqual(2);
      expect(Math.round(valeur * 10) / 10).toBe(valeur);
    }
  });

  it('choisit un element de la liste', () => {
    const tirage = creerTirage(creerRng(9));
    expect(['x', 'y']).toContain(tirage.choix(['x', 'y']));
  });

  it('refuse des bornes inversees ou non entieres', () => {
    const tirage = creerTirage(creerRng(1));
    expect(() => tirage.entier(3, 1)).toThrow(RangeError);
    expect(() => tirage.entier(1.5, 3)).toThrow(RangeError);
    expect(() => tirage.decimal(1, 2, 0)).toThrow(RangeError);
  });
});
