import { REGLE_DE_NOTATION } from './RegleDeNotation';

const { partCohorteReference, noteMax, ratioSeuilValidation } =
  REGLE_DE_NOTATION;

export interface ParticipantCompletion {
  participantId: string;
  completion: number;
}

export interface CohortScore {
  participantId: string;
  completion: number;
  note: number;
  sousSeuil: boolean;
}

export function computeCohortScore(
  completions: readonly ParticipantCompletion[],
): readonly CohortScore[] {
  if (completions.length === 0) {
    return [];
  }
  const reference = computeReference(completions);
  const seuil = reference * ratioSeuilValidation;
  return completions.map((entree) => ({
    participantId: entree.participantId,
    completion: entree.completion,
    note:
      reference === 0
        ? 0
        : Math.min(noteMax, (noteMax * entree.completion) / reference),
    sousSeuil: entree.completion < seuil,
  }));
}

function computeReference(
  completions: readonly ParticipantCompletion[],
): number {
  const triees = completions
    .map((entree) => entree.completion)
    .sort((gauche, droite) => droite - gauche);
  const rang = Math.max(0, Math.ceil(triees.length * partCohorteReference) - 1);
  return triees[rang] ?? 0;
}
