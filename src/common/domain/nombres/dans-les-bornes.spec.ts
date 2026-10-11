import { dansLesBornes } from './dans-les-bornes';

describe('dansLesBornes', () => {
  const BORNES = { min: 20, max: 65 };

  it.each([
    [20, true],
    [42, true],
    [65, true],
    [19, false],
    [66, false],
    [Number.NaN, false],
  ])('situe %p par rapport à [20 ; 65] : %p', (valeur, attendu) => {
    expect(dansLesBornes(valeur, BORNES)).toBe(attendu);
  });
});
