export const STATUTS_SCORE = Object.freeze([
  'critical',
  'warning',
  'ok',
] as const);

export type StatutScore = (typeof STATUTS_SCORE)[number];

export const LIBELLES_DU_STATUT: Readonly<Record<StatutScore, string>> =
  Object.freeze({
    critical: 'Critique',
    warning: 'À améliorer',
    ok: 'Objectif atteint',
  });

const SEUIL_OK = 80;
const SEUIL_DE_VIGILANCE = 55;

export function statutDuScore(score: number): StatutScore {
  if (score >= SEUIL_OK) {
    return 'ok';
  }
  return score >= SEUIL_DE_VIGILANCE ? 'warning' : 'critical';
}
