import type { AnswerValue, Piege, Tolerance } from './GradingCore';
import { matchesSolution } from './GradingCore';

export function detectMisconception<M extends string>(
  valeur: AnswerValue,
  pieges: readonly Piege<M>[],
  tolerance?: Tolerance,
): M | null {
  const trouve = pieges.find((piege) =>
    matchesSolution(valeur, piege.valeur, tolerance),
  );
  return trouve ? trouve.misconception : null;
}
