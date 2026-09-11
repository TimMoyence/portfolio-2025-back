import type { BaremeQuestion } from './Bareme';
import { questionsNotees } from './Bareme';
import { computeCohortScore } from './CompletionScore';
import type { AnswerRecord } from './IAnswers.repository';
import type {
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from './IFormationMailer.port';
import type { IncidentRecord } from './IIncidents.repository';
import type { ParticipantRecord } from './IParticipants.repository';
import type { SessionRecord } from './ISessions.repository';

const SEUIL_CONCEPT_FRAGILE = 0.7;

export interface SessionReportInput {
  session: SessionRecord;
  participants: readonly ParticipantRecord[];
  answers: readonly AnswerRecord[];
  incidents: readonly IncidentRecord[];
}

export function buildRapportSession(input: SessionReportInput): RapportSession {
  const notees = questionsNotees(input.session.bareme);
  const completions = input.participants.map((participant) => ({
    participantId: participant.id,
    completion: completionDe(participant.id, input.answers, notees),
  }));
  const scores = computeCohortScore(completions);

  const participants: readonly RapportParticipant[] = input.participants.map(
    (participant) => {
      const score = scores.find(
        (entree) => entree.participantId === participant.id,
      );
      return {
        prenom: participant.prenom,
        nom: participant.nom,
        email: participant.email,
        completion: score?.completion ?? 0,
        note: score?.note ?? 0,
        sousSeuil: score?.sousSeuil ?? true,
        reponses: reponsesDe(participant.id, input.answers),
        incidents: input.incidents.filter(
          (incident) => incident.participantId === participant.id,
        ).length,
      };
    },
  );

  return {
    courseSlug: input.session.courseSlug,
    code: input.session.code,
    ouverteLe: input.session.ouverteLe,
    fermeeLe: input.session.fermeeLe ?? new Date(),
    participants,
    conceptsFragiles: conceptsFragilesDe(input.answers),
  };
}

function completionDe(
  participantId: string,
  reponses: readonly AnswerRecord[],
  notees: readonly BaremeQuestion[],
): number {
  if (notees.length === 0) {
    return 0;
  }
  const repondues = notees.filter((question) =>
    reponses.some(
      (reponse) =>
        reponse.participantId === participantId &&
        reponse.questionId === question.id,
    ),
  );
  return repondues.length / notees.length;
}

function reponsesDe(
  participantId: string,
  reponses: readonly AnswerRecord[],
): readonly RapportQuestion[] {
  return reponses
    .filter((reponse) => reponse.participantId === participantId)
    .map((reponse) => ({
      questionId: reponse.questionId,
      concept: reponse.concept,
      valeur: String(reponse.valeur),
      correcte: reponse.correcte,
      misconception: reponse.misconception,
      dureeMs: reponse.dureeMs,
    }));
}

function conceptsFragilesDe(
  reponses: readonly AnswerRecord[],
): readonly string[] {
  const parConcept = new Map<string, { total: number; correctes: number }>();
  for (const reponse of reponses) {
    const entree = parConcept.get(reponse.concept) ?? {
      total: 0,
      correctes: 0,
    };
    entree.total += 1;
    if (reponse.correcte) {
      entree.correctes += 1;
    }
    parConcept.set(reponse.concept, entree);
  }
  const fragiles: string[] = [];
  for (const [concept, { total, correctes }] of parConcept) {
    if (correctes / total < SEUIL_CONCEPT_FRAGILE) {
      fragiles.push(concept);
    }
  }
  return fragiles;
}
