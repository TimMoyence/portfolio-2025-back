import { scoreMoyenSur100, scoreSur100 } from './score-sur-100';

describe('scoreSur100', () => {
  it('arrondit un score à l entier', () => {
    expect(scoreSur100(72.6)).toBe(73);
  });

  it('borne un score entre 0 et 100', () => {
    expect(scoreSur100(-15)).toBe(0);
    expect(scoreSur100(130)).toBe(100);
  });

  it('ramène à 0 un score non fini', () => {
    expect(scoreSur100(Number.NaN)).toBe(0);
    expect(scoreSur100(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('scoreMoyenSur100', () => {
  it('vaut 0 sans aucun score', () => {
    expect(scoreMoyenSur100([])).toBe(0);
  });

  it('arrondit la moyenne des scores', () => {
    expect(scoreMoyenSur100([70, 75, 75])).toBe(73);
  });
});
