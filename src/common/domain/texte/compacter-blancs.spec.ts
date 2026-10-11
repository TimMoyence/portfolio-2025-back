import { compacterBlancs } from './compacter-blancs';

describe('compacterBlancs', () => {
  it.each([
    ['hello   world   test', 'hello world test'],
    ['hello\n\nworld', 'hello world'],
    ['\t  bords  \n', 'bords'],
    ['   ', ''],
    ['', ''],
  ])('réduit chaque suite de blancs de %p à une espace', (brut, attendu) => {
    expect(compacterBlancs(brut)).toBe(attendu);
  });
});
