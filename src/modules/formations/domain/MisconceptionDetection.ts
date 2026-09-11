import type { AnswerValue, Piege, Tolerance } from './GradingCore';
import { matchesSolution } from './GradingCore';

export function detectMisconception(
  valeur: AnswerValue,
  pieges: readonly Piege[],
  tolerance?: Tolerance,
): string | null {
  const trouve = pieges.find((piege) =>
    matchesSolution(valeur, piege.valeur, tolerance),
  );
  return trouve ? trouve.misconception : null;
}
