import { detectMisconception } from './MisconceptionDetection';

describe('detectMisconception', () => {
  const pieges = [
    { valeur: 1300, misconception: 'interet-simple' },
    { valeur: 5350, misconception: 'multiplication-au-lieu-de-puissance' },
  ];

  it('retourne la misconception du premier piege correspondant', () => {
    expect(detectMisconception(1300, pieges)).toBe('interet-simple');
  });

  it('applique la tolerance aux pieges', () => {
    expect(
      detectMisconception(1303, pieges, { type: 'relative', valeur: 0.005 }),
    ).toBe('interet-simple');
  });

  it('retourne null si aucun piege ne correspond', () => {
    expect(detectMisconception(9999, pieges)).toBeNull();
  });

  it('retourne null sur une liste de pieges vide', () => {
    expect(detectMisconception(1300, [])).toBeNull();
  });
});
