import { avecVirgule, nombreFrancais } from './ecriture-francaise';

describe('nombreFrancais', () => {
  it.each([
    [1234567.891, 2, '1 234 567,89'],
    [1234, 0, '1 234'],
    [999, 0, '999'],
    [0.5, 2, '0,50'],
    [-12345.6, 1, '-12 345,6'],
  ])('écrit %p avec %p décimales en %p', (valeur, decimales, attendue) => {
    expect(nombreFrancais(valeur, decimales)).toBe(attendue);
  });
});

describe('avecVirgule', () => {
  it('fixe le nombre de décimales sans grouper les milliers', () => {
    expect(avecVirgule(1234.5, 2)).toBe('1234,50');
  });

  it('garde l écriture la plus courte sans décimales imposées', () => {
    expect(avecVirgule(12.25)).toBe('12,25');
    expect(avecVirgule(40)).toBe('40');
  });
});
