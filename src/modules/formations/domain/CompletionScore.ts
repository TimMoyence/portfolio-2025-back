const PART_COHORTE_REFERENCE = 0.2;
const NOTE_MAX = 20;
const RATIO_SEUIL_VALIDATION = 0.4;

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
  const seuil = reference * RATIO_SEUIL_VALIDATION;
  return completions.map((entree) => ({
    participantId: entree.participantId,
    completion: entree.completion,
    note:
      reference === 0
        ? 0
        : Math.min(NOTE_MAX, (NOTE_MAX * entree.completion) / reference),
    sousSeuil: entree.completion < seuil,
  }));
}

function computeReference(
  completions: readonly ParticipantCompletion[],
): number {
  const triees = completions
    .map((entree) => entree.completion)
    .sort((gauche, droite) => droite - gauche);
  const rang = Math.max(
    0,
    Math.ceil(triees.length * PART_COHORTE_REFERENCE) - 1,
  );
  return triees[rang] ?? 0;
}
