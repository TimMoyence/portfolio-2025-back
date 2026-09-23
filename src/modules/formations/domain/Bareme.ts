import type { AnswerValue, Solution, Tolerance } from './AnswerGrading';
import type {
  BaremeQuestionV2,
  Bareme as BaremeDeSeance,
} from './contrats/bareme';
import type { Cours, TypeQuestion } from './contrats/cours';
import type { ResumeBareme } from './contrats/resultats';
import type { QuestionAAgreger } from './ResultatsSeance';
import { CONCEPTS, type ConceptId } from './cours/banque/concepts';
import { rangDeLaQuestion } from './cours/EcranServi';
import { NE_SAIT_PAS } from './GradingCore';

type QuestionType = 'numeric' | 'vote' | 'asn' | 'order';

interface BaremeQuestion {
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

export type QuestionDeBareme = BaremeQuestion | BaremeQuestionV2;

function questionsDuBareme(
  bareme: BaremeDeSeance,
): readonly QuestionDeBareme[] {
  return bareme.questions;
}

export function findQuestion(
  bareme: BaremeDeSeance,
  questionId: string,
): QuestionDeBareme | null {
  return (
    questionsDuBareme(bareme).find((question) => question.id === questionId) ??
    null
  );
}

export function solutionsDuTirage(
  bareme: BaremeDeSeance,
  seed: number,
): Readonly<Record<string, Solution>> | undefined {
  if (bareme.version === 1) {
    return bareme.tirages.find((tirage) => tirage.seed === seed)?.solutions;
  }
  const tirage = bareme.tirages.find((entree) => entree.seed === seed);
  return tirage === undefined
    ? undefined
    : { ...bareme.solutionsCommunes, ...tirage.ecarts };
}

export function solutionFor(
  bareme: BaremeDeSeance,
  seed: number,
  questionId: string,
): Solution | null {
  const solutions = solutionsDuTirage(bareme, seed);
  return solutions !== undefined && Object.hasOwn(solutions, questionId)
    ? solutions[questionId]
    : null;
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
  bareme: BaremeDeSeance,
  seedsPris: readonly number[],
): number | null {
  if (bareme.questions.length === 0) {
    let seed = 0;
    while (seedsPris.includes(seed)) {
      seed += 1;
    }
    return seed;
  }
  const graines: readonly number[] = bareme.tirages.map(
    (tirage) => tirage.seed,
  );
  return graines.find((seed) => !seedsPris.includes(seed)) ?? null;
}

export function questionsNotees(
  bareme: BaremeDeSeance,
): readonly QuestionDeBareme[] {
  return questionsDuBareme(bareme).filter((question) => question.noteCompte);
}

function estConcept(concept: string): concept is ConceptId {
  return (CONCEPTS as readonly string[]).includes(concept);
}

export function questionDuBareme(
  bareme: BaremeDeSeance,
  questionId: string,
  cours: Cours | null,
): BaremeQuestionV2 | null {
  if (bareme.version === 2) {
    return (
      bareme.questions.find((question) => question.id === questionId) ?? null
    );
  }
  const question = bareme.questions.find(
    (candidate) => candidate.id === questionId,
  );
  const rangEcran = cours === null ? -1 : rangDeLaQuestion(cours, questionId);
  if (
    question === undefined ||
    cours === null ||
    rangEcran < 0 ||
    (question.type !== 'numeric' && question.type !== 'vote') ||
    !estConcept(question.concept)
  ) {
    return null;
  }
  return {
    id: question.id,
    type: question.type,
    concept: question.concept,
    noteCompte: question.noteCompte,
    ecranId: cours.ecrans[rangEcran].id,
    rangEcran,
    ...(question.tolerance === undefined
      ? {}
      : { tolerance: question.tolerance }),
  };
}

const TYPES_DE_QUESTION: readonly string[] = [
  'numeric',
  'vote',
  'feuille',
  'tableau',
  'classement',
  'enigme',
];

function typeAgregeable(type: string): TypeQuestion {
  return TYPES_DE_QUESTION.includes(type) ? (type as TypeQuestion) : 'vote';
}

export function questionsAAgreger(
  bareme: BaremeDeSeance,
  cours: Cours | null,
): readonly QuestionAAgreger[] {
  return questionsDuBareme(bareme).map((question) => {
    const enrichie = questionDuBareme(bareme, question.id, cours);
    return {
      id: question.id,
      type: enrichie?.type ?? typeAgregeable(question.type),
      noteCompte: question.noteCompte,
      ecranId: enrichie?.ecranId ?? '',
    };
  });
}

export function resumeDuBareme(bareme: BaremeDeSeance): ResumeBareme {
  const parType: Record<string, { notees: number; nonNotees: number }> = {};
  for (const type of TYPES_DE_QUESTION) {
    parType[type] = { notees: 0, nonNotees: 0 };
  }
  for (const question of questionsDuBareme(bareme)) {
    const compte = parType[typeAgregeable(question.type)];
    if (question.noteCompte) {
      compte.notees += 1;
    } else {
      compte.nonNotees += 1;
    }
  }
  return {
    questionsNotees: questionsNotees(bareme).length,
    parType: parType as ResumeBareme['parType'],
  };
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
