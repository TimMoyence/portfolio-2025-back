import type { AnswerValue, Solution, Tolerance } from './AnswerGrading';
import { NE_SAIT_PAS } from './GradingCore';

type QuestionType = 'numeric' | 'vote' | 'asn' | 'order';

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
  graineReference: number;
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
  if (bareme.questions.length === 0) {
    let seed = 0;
    while (seedsPris.includes(seed)) {
      seed += 1;
    }
    return seed;
  }
  const libre = bareme.tirages.find(
    (tirage) => !seedsPris.includes(tirage.seed),
  );
  return libre ? libre.seed : null;
}

export function questionsNotees(bareme: Bareme): readonly BaremeQuestion[] {
  return bareme.questions.filter((question) => question.noteCompte);
}

export function solutionsIdentiques(
  attendues: Readonly<Record<string, Solution>>,
  stockees: Readonly<Record<string, Solution>> | undefined,
): boolean {
  if (!stockees) {
    return false;
  }
  const clesAttendues = Object.keys(attendues).sort(compareAlphabetique);
  const clesStockees = Object.keys(stockees).sort(compareAlphabetique);
  return (
    clesAttendues.length === clesStockees.length &&
    clesAttendues.every((cle, index) => cle === clesStockees[index]) &&
    clesAttendues.every((cle) => solutionEgale(attendues[cle], stockees[cle]))
  );
}

function compareAlphabetique(a: string, b: string): number {
  return a.localeCompare(b);
}

function solutionEgale(attendue: Solution, stockee: Solution): boolean {
  return (
    attendue.valeur === stockee.valeur &&
    attendue.pieges.length === stockee.pieges.length &&
    attendue.pieges.every(
      (piege, index) =>
        piege.valeur === stockee.pieges[index].valeur &&
        piege.misconception === stockee.pieges[index].misconception,
    )
  );
}
