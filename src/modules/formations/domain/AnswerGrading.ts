import { detectMisconception } from './MisconceptionDetection';
import type {
  AnswerValue,
  GradingResult,
  Solution,
  Tolerance,
} from './GradingTypes';
import { NE_SAIT_PAS, matchesSolution } from './GradingTypes';

export type {
  AnswerValue,
  GradingResult,
  Piege,
  Solution,
  Tolerance,
  ToleranceType,
} from './GradingTypes';
export { matchesSolution };

export function gradeAnswer(
  valeur: AnswerValue,
  solution: Solution,
  tolerance?: Tolerance,
): GradingResult {
  if (valeur === NE_SAIT_PAS) {
    return { correcte: false, misconception: null };
  }
  if (matchesSolution(valeur, solution.valeur, tolerance)) {
    return { correcte: true, misconception: null };
  }
  return {
    correcte: false,
    misconception: detectMisconception(valeur, solution.pieges, tolerance),
  };
}
