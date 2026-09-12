import type { AnswerValue, Solution, Tolerance } from './AnswerGrading';
import { NE_SAIT_PAS } from './GradingCore';

export const QUESTION_TYPES = ['numeric', 'vote', 'asn', 'order'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface BaremeQuestion {
  id: string;
  type: QuestionType;
  concept: string;
  tolerance?: Tolerance;
  noteCompte: boolean;
}

export interface BaremeTirage {
  seed: number;
  solutions: Readonly<Record<string, Solution>>;
}

export interface Bareme {
  version: 1;
  questions: readonly BaremeQuestion[];
  tirages: readonly BaremeTirage[];
}

export function findQuestion(
  bareme: Bareme,
  questionId: string,
): BaremeQuestion | null {
  return (
    bareme.questions.find((question) => question.id === questionId) ?? null
  );
}

export function solutionFor(
  bareme: Bareme,
  seed: number,
  questionId: string,
): Solution | null {
  const tirage = bareme.tirages.find((entree) => entree.seed === seed);
  return tirage?.solutions[questionId] ?? null;
}

export function estValeurConnue(
  solution: Solution,
  valeur: AnswerValue,
): boolean {
  if (valeur === NE_SAIT_PAS) {
    return true;
  }
  return (
    valeur === solution.valeur ||
    solution.pieges.some((piege) => piege.valeur === valeur)
  );
}

export function pickFreeSeed(
  bareme: Bareme,
  seedsPris: readonly number[],
): number | null {
  const libre = bareme.tirages.find(
    (tirage) => !seedsPris.includes(tirage.seed),
  );
  return libre ? libre.seed : null;
}

export function questionsNotees(bareme: Bareme): readonly BaremeQuestion[] {
  return bareme.questions.filter((question) => question.noteCompte);
}
