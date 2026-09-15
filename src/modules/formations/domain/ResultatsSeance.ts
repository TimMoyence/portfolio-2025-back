import type { Bareme } from './Bareme';
import { libelleDeConfusion } from './cours/banque/confusions';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';
import type { ParticipantRecord } from './IParticipants.repository';

export interface ConfusionComptee {
  readonly id: string;
  readonly libelle: string;
  readonly nombre: number;
}

export interface ResultatQuestion {
  readonly questionId: string;
  readonly total: number;
  readonly correctes: number;
  readonly neSaitPas: number;
  readonly confusions: readonly ConfusionComptee[];
}

export interface ResultatsSeance {
  readonly participants: number;
  readonly questions: readonly ResultatQuestion[];
}

export interface AgregerResultatsInput {
  readonly bareme: Bareme;
  readonly answers: readonly AnswerRecord[];
  readonly participants: readonly ParticipantRecord[];
}

export function agregerResultats(
  entree: AgregerResultatsInput,
): ResultatsSeance {
  return {
    participants: entree.participants.length,
    questions: entree.bareme.questions.map((question) =>
      agregerQuestion(question.id, entree.answers),
    ),
  };
}

function agregerQuestion(
  questionId: string,
  answers: readonly AnswerRecord[],
): ResultatQuestion {
  const reponses = answers.filter(
    (reponse) => reponse.questionId === questionId,
  );
  return {
    questionId,
    total: reponses.length,
    correctes: reponses.filter((reponse) => reponse.correcte).length,
    neSaitPas: reponses.filter((reponse) => reponse.valeur === NE_SAIT_PAS)
      .length,
    confusions: compterConfusions(reponses),
  };
}

function compterConfusions(
  reponses: readonly AnswerRecord[],
): readonly ConfusionComptee[] {
  const nombresParId = new Map<string, number>();
  for (const reponse of reponses) {
    if (reponse.misconception === null) {
      continue;
    }
    nombresParId.set(
      reponse.misconception,
      (nombresParId.get(reponse.misconception) ?? 0) + 1,
    );
  }
  return [...nombresParId.entries()]
    .map(([id, nombre]) => ({
      id,
      libelle: libelleDeConfusion(id) ?? id,
      nombre,
    }))
    .sort((premiere, seconde) =>
      premiere.nombre !== seconde.nombre
        ? seconde.nombre - premiere.nombre
        : premiere.id.localeCompare(seconde.id),
    );
}
