import type { UpdateResult } from 'typeorm';
import { aAffecte, lignesAffectees } from './lignes-affectees';

const resultatAvec = (affected: unknown) =>
  ({ affected, raw: [], generatedMaps: [] }) as UpdateResult;

describe('lignesAffectees', () => {
  it('rend le nombre de lignes que la base a touchees', () => {
    expect(lignesAffectees(resultatAvec(3))).toBe(3);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
  ])('leve quand le pilote rend %s au lieu d un nombre', (_label, affected) => {
    expect(() => lignesAffectees(resultatAvec(affected))).toThrow(
      'nombre de lignes',
    );
  });
});

describe('aAffecte', () => {
  it.each([
    [1, true],
    [2, true],
    [0, false],
  ])('pour %i ligne(s) touchee(s) rend %s', (affected, attendu) => {
    expect(aAffecte(resultatAvec(affected))).toBe(attendu);
  });

  it('leve quand le pilote ne rend aucun nombre', () => {
    expect(() => aAffecte(resultatAvec(undefined))).toThrow('nombre de lignes');
  });
});
