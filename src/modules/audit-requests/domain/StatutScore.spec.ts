import { statutDuScore } from './StatutScore';

describe('statutDuScore', () => {
  it.each([
    [100, 'ok'],
    [80, 'ok'],
    [79.9, 'warning'],
    [55, 'warning'],
    [54.9, 'critical'],
    [0, 'critical'],
  ])('classe %d en %s', (score, statut) => {
    expect(statutDuScore(score)).toBe(statut);
  });
});
