import type { AuditLocale } from './audit-locale.util';

export const STATUTS_SCORE = Object.freeze([
  'critical',
  'warning',
  'ok',
] as const);

export type StatutScore = (typeof STATUTS_SCORE)[number];

const LIBELLES_DU_STATUT: Readonly<
  Record<AuditLocale, Readonly<Record<StatutScore, string>>>
> = Object.freeze({
  fr: Object.freeze({
    critical: 'Critique',
    warning: 'À améliorer',
    ok: 'Objectif atteint',
  }),
  en: Object.freeze({
    critical: 'Critical',
    warning: 'Needs improvement',
    ok: 'Target met',
  }),
});

const CIBLE_PAR_DEFAUT = 80;
const SEUIL_DE_VIGILANCE = 55;

export function statutDuScore(
  score: number,
  cible: number = CIBLE_PAR_DEFAUT,
): StatutScore {
  if (score >= cible) {
    return 'ok';
  }
  return score >= SEUIL_DE_VIGILANCE ? 'warning' : 'critical';
}

export function libelleDuStatut(
  statut: StatutScore,
  locale: AuditLocale,
): string {
  return LIBELLES_DU_STATUT[locale][statut];
}
