import { borner } from './borner';

describe('borner', () => {
  it('garde une valeur comprise entre les bornes', () => {
    expect(String(borner(0.4, 0, 1))).toBe('0.4');
  });

  it('ramène une valeur hors bornes sur la borne franchie', () => {
    expect(borner(-3, 0, 100)).toBe(0);
    expect(borner(140, 0, 100)).toBe(100);
    expect(String(borner(0.99, 0.3, 0.95))).toBe('0.95');
  });
});
