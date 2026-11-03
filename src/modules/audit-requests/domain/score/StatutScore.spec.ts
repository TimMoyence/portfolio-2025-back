import { libelleDuStatut, STATUTS_SCORE, statutDuScore } from './StatutScore';

describe('statutDuScore', () => {
  it.each([
    [100, 'ok'],
    [80, 'ok'],
    [79.9, 'warning'],
    [55, 'warning'],
    [54.9, 'critical'],
    [0, 'critical'],
  ])('classe %d en %s sans cible, sur 80 et 55', (score, statut) => {
    expect(statutDuScore(score)).toBe(statut);
  });

  it.each([
    [85, 85, 'ok'],
    [84, 85, 'warning'],
    [70, 65, 'ok'],
    [60, 70, 'warning'],
    [54, 70, 'critical'],
    [50, 40, 'ok'],
  ])(
    'B-68 · classe %d face à la cible %d en %s : objectif atteint dès la cible affichée, à améliorer dès 55',
    (score, cible, statut) => {
      expect(statutDuScore(score, cible)).toBe(statut);
    },
  );
});

describe('libelleDuStatut', () => {
  it('B-68 · nomme chaque statut dans la langue de l audit', () => {
    expect(
      STATUTS_SCORE.map((statut) => [
        libelleDuStatut(statut, 'fr'),
        libelleDuStatut(statut, 'en'),
      ]),
    ).toEqual([
      ['Critique', 'Critical'],
      ['À améliorer', 'Needs improvement'],
      ['Objectif atteint', 'Target met'],
    ]);
  });
});
