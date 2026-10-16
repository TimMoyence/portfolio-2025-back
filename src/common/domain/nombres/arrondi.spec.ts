import { arrondi, auCentime, auMillionieme } from './arrondi';

describe('arrondi', () => {
  it('arrondit au nombre de décimales demandé', () => {
    expect(String(arrondi(2.345678, 2))).toBe('2.35');
    expect(String(arrondi(12.25, 1))).toBe('12.3');
    expect(arrondi(7.4, 0)).toBe(7);
  });

  it('arrondit une moitié négative en s éloignant de zéro', () => {
    expect(arrondi(-2.5, 0)).toBe(-3);
  });

  it('arrondit la moitié décimale en s éloignant de zéro, comme ARRONDI d Excel, malgré l écriture binaire', () => {
    expect(String(auCentime(1.5 * 80.35))).toBe('120.53');
    expect(String(arrondi(2.675, 2))).toBe('2.68');
    expect(String(arrondi(1.005, 2))).toBe('1.01');
    expect(String(arrondi(-1.005, 2))).toBe('-1.01');
    expect(arrondi(12_345, -2)).toBe(12_300);
    expect(Object.is(arrondi(-0.004, 2), 0)).toBe(true);
  });

  it('arrondit au centime et au millionième', () => {
    expect(String(auCentime(1053.2249))).toBe('1053.22');
    expect(String(auMillionieme(1 / 3))).toBe('0.333333');
  });
});
