import { sansBords, sansFin } from './sans-bords';

describe('sansBords', () => {
  it.each([
    ['/api/v1/', 'api/v1'],
    ['///', ''],
    ['', ''],
    ['api//v1', 'api//v1'],
  ])('retire les barres aux deux bords de %p', (brut, attendu) => {
    expect(sansBords(brut, '/')).toBe(attendu);
  });

  it('retire n importe quel caractère, pas seulement la barre', () => {
    expect(sansBords('--titre-de-cours--', '-')).toBe('titre-de-cours');
  });

  it('reste linéaire sur une longue répétition du caractère', () => {
    expect(sansBords(`${'/'.repeat(100_000)}a`, '/')).toBe('a');
  });
});

describe('sansFin', () => {
  it.each([
    ['https://asilidesign.fr///', 'https://asilidesign.fr'],
    ['/fr/', '/fr'],
    ['///', ''],
  ])('ne retire que les barres de fin de %p', (brut, attendu) => {
    expect(sansFin(brut, '/')).toBe(attendu);
  });
});
