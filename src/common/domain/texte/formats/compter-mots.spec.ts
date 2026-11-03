import { compterMots } from './compter-mots';

describe('compterMots', () => {
  it.each([
    ['un deux trois', 3],
    ['\n  un\n\tdeux  \n', 2],
    ['   ', 0],
    ['', 0],
  ])('compte les mots de %p', (texte, attendu) => {
    expect(compterMots(texte)).toBe(attendu);
  });
});
