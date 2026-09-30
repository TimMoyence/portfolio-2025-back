export const NE_SAIT_PAS = '__je_ne_sais_pas__';

type ToleranceType = 'relative' | 'absolue' | 'decimales';

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
    return ecartDansLaBorne(valeur, solution, tolerance.valeur);
  }
  if (tolerance.type === 'decimales') {
    const facteur = 10 ** tolerance.valeur;
    return Math.round(valeur * facteur) === Math.round(solution * facteur);
  }
  if (solution === 0) {
    return valeur === 0;
  }
  return ecartDansLaBorne(
    valeur,
    solution,
    Math.abs(solution) * tolerance.valeur,
  );
}

function ecartDansLaBorne(
  valeur: number,
  solution: number,
  borne: number,
): boolean {
  const bruitDesFlottants =
    Number.EPSILON * Math.max(Math.abs(valeur), Math.abs(solution));
  return Math.abs(valeur - solution) <= borne + bruitDesFlottants;
}

function estFinie(valeur: AnswerValue): boolean {
  return typeof valeur === 'string' || Number.isFinite(valeur);
}

function seConfondent(
  a: AnswerValue,
  b: AnswerValue,
  tolerance: Tolerance | undefined,
): boolean {
  return matchesSolution(a, b, tolerance) || matchesSolution(b, a, tolerance);
}

export function valeursAmbigues(
  valeurs: readonly AnswerValue[],
  tolerance?: Tolerance,
): boolean {
  return valeurs.some(
    (valeur, rang) =>
      !estFinie(valeur) ||
      valeurs
        .slice(rang + 1)
        .some((autre) => seConfondent(valeur, autre, tolerance)),
  );
}
