import { textesUniquesBornes } from './textes-uniques-bornes';

describe('textesUniquesBornes', () => {
  it('retire les bords, écarte les vides et garde la première occurrence', () => {
    expect(textesUniquesBornes([' A', 'B ', '', '   ', 'A', 'C'], 5)).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('borne la liste après le dédoublonnage', () => {
    expect(textesUniquesBornes(['A', 'A', 'B', 'C'], 2)).toEqual(['A', 'B']);
  });

  it('rend une liste vide pour une borne nulle', () => {
    expect(textesUniquesBornes(['A'], 0)).toEqual([]);
  });
});
