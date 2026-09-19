import type { RapportParticipant } from './IFormationMailer.port';
import { REGLE_DE_NOTATION } from './RegleDeNotation';
import type { ResultatsSeance } from './ResultatsSeance';

const { seuilQuestionProbleme, decimalesStatistiques } = REGLE_DE_NOTATION;
const ECHELLE_D_ARRONDI = 10 ** decimalesStatistiques;

export interface StatistiquesSeance {
  readonly moyenne: number;
  readonly mediane: number;
  readonly dispersion: number;
  readonly tauxParticipation: number;
  readonly tauxReussite: number;
  readonly questionsProblemes: readonly string[];
}

export function calculerStatistiquesSeance(
  participants: readonly RapportParticipant[],
  resultats: ResultatsSeance,
): StatistiquesSeance {
  const notes = participants
    .map((participant) => participant.note)
    .sort((a, b) => a - b);
  const moyenne =
    notes.length === 0
      ? 0
      : notes.reduce((total, note) => total + note, 0) / notes.length;
  const mediane = medianeDe(notes);
  const variance =
    notes.length === 0
      ? 0
      : notes.reduce((total, note) => total + (note - moyenne) ** 2, 0) /
        notes.length;
  const reponses = resultats.questions.reduce(
    (total, question) => total + question.total,
    0,
  );
  const correctes = resultats.questions.reduce(
    (total, question) => total + question.correctes,
    0,
  );
  return {
    moyenne: arrondir(moyenne),
    mediane: arrondir(mediane),
    dispersion: arrondir(Math.sqrt(variance)),
    tauxParticipation:
      participants.length === 0
        ? 0
        : participants.filter((participant) => participant.completion > 0)
            .length / participants.length,
    tauxReussite: reponses === 0 ? 0 : correctes / reponses,
    questionsProblemes: resultats.questions
      .filter(
        (question) =>
          question.total > 0 &&
          question.correctes / question.total < seuilQuestionProbleme,
      )
      .map((question) => question.questionId),
  };
}

function medianeDe(notes: readonly number[]): number {
  if (notes.length === 0) return 0;
  const milieu = Math.floor(notes.length / 2);
  return notes.length % 2 === 0
    ? (notes[milieu - 1] + notes[milieu]) / 2
    : notes[milieu];
}

function arrondir(valeur: number): number {
  return Math.round(valeur * ECHELLE_D_ARRONDI) / ECHELLE_D_ARRONDI;
}
