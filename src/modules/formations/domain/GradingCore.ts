export const NE_SAIT_PAS = '__je_ne_sais_pas__';

export const TOLERANCE_TYPES = ['relative', 'absolue', 'decimales'] as const;

export type ToleranceType = (typeof TOLERANCE_TYPES)[number];

export interface Tolerance {
  type: ToleranceType;
  valeur: number;
}

export type AnswerValue = number | string;

export interface Piege {
  valeur: AnswerValue;
  misconception: string;
}

export interface Solution {
  valeur: AnswerValue;
  pieges: readonly Piege[];
}

export interface GradingResult {
  correcte: boolean;
  misconception: string | null;
}

export function matchesSolution(
  valeur: AnswerValue,
  solution: AnswerValue,
  tolerance?: Tolerance,
): boolean {
  if (typeof solution === 'string') {
    return valeur === solution;
  }
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
    return false;
  }
  if (!tolerance) {
    return valeur === solution;
  }
  if (tolerance.type === 'absolue') {
    return Math.abs(valeur - solution) <= tolerance.valeur;
  }
  if (tolerance.type === 'decimales') {
    const facteur = 10 ** tolerance.valeur;
    return Math.round(valeur * facteur) === Math.round(solution * facteur);
  }
  if (solution === 0) {
    return valeur === 0;
  }
  return Math.abs(valeur - solution) <= Math.abs(solution) * tolerance.valeur;
}
