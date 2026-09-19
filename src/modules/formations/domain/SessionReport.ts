import type { QuestionDeBareme } from './Bareme';
import {
  questionsNotees,
  solutionsDuTirage,
  solutionsIdentiques,
} from './Bareme';
import { libelleDeConfusion } from './cours/banque/confusions';
import type { Cours } from './contrats/cours';
import { tirer } from './cours/Tirage';
import type { LibellesDesOptions } from './cours/Tirage';
import { computeCohortScore } from './CompletionScore';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';
import type {
  RapportParticipant,
  RapportQuestion,
  RapportSession,
} from './IFormationMailer.port';
import type { IncidentRecord } from './IIncidents.repository';
import type { ParticipantRecord } from './IParticipants.repository';
import type { SessionRecord } from './ISessions.repository';
import { REGLE_DE_NOTATION } from './RegleDeNotation';

const SEUIL_CONCEPT_FRAGILE = 0.7;
const LIBELLE_NE_SAIT_PAS = 'Je ne sais pas';
const POINT_PAR_QUESTION_REPONDUE = 1;

export interface SessionReportInput {
  session: SessionRecord;
  cours: Cours | null;
  participants: readonly ParticipantRecord[];
  answers: readonly AnswerRecord[];
  incidents: readonly IncidentRecord[];
  avertir(message: string): void;
}

export function buildRapportSession(input: SessionReportInput): RapportSession {
  const notees = questionsNotees(input.session.bareme);
  const completions = input.participants.map((participant) => ({
    participantId: participant.id,
    completion: completionDe(participant.id, input.answers, notees),
  }));
  const scores = computeCohortScore(completions);
  const rangs = new Map(
    input.session.bareme.questions.map((question, rang) => [question.id, rang]),
  );
  const tiragesEnEchec: string[] = [];
  const libellesDe = (graine: number): LibellesDesOptions => {
    try {
      return libellesDuTirage(input, graine);
    } catch (erreur) {
      tiragesEnEchec.push(nomDErreur(erreur));
      return {};
    }
  };

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
        reponses: reponsesDe(
          participant.id,
          input.answers,
          rangs,
          libellesDe(participant.seed),
        ),
        incidents: input.incidents.filter(
          (incident) => incident.participantId === participant.id,
        ).length,
      };
    },
  );
  signalerTiragesEnEchec(input, tiragesEnEchec);

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
  notees: readonly QuestionDeBareme[],
): number {
  if (notees.length === 0) {
    return 0;
  }
  const points = notees.reduce(
    (total, question) =>
      total +
      (reponses.some(
        (reponse) =>
          reponse.participantId === participantId &&
          reponse.questionId === question.id &&
          compteCommeReponse(reponse),
      )
        ? POINT_PAR_QUESTION_REPONDUE
        : REGLE_DE_NOTATION.pointsNonReponse),
    0,
  );
  return points / notees.length;
}

function compteCommeReponse(reponse: AnswerRecord): boolean {
  return (
    reponse.valeur !== NE_SAIT_PAS ||
    REGLE_DE_NOTATION.neSaitPasCompteCommeReponse
  );
}

function reponsesDe(
  participantId: string,
  reponses: readonly AnswerRecord[],
  rangs: ReadonlyMap<string, number>,
  libelles: LibellesDesOptions,
): readonly RapportQuestion[] {
  const rangDe = (reponse: AnswerRecord): number =>
    rangs.get(reponse.questionId) ?? rangs.size;
  return reponses
    .filter((reponse) => reponse.participantId === participantId)
    .sort((premiere, seconde) => rangDe(premiere) - rangDe(seconde))
    .map((reponse) => ({
      questionId: reponse.questionId,
      concept: reponse.concept,
      valeur: String(reponse.valeur),
      reponse: reponseLisible(reponse, libelles),
      correcte: reponse.correcte,
      misconception: reponse.misconception,
      libelleConfusion:
        reponse.misconception === null
          ? null
          : (libelleDeConfusion(reponse.misconception) ??
            reponse.misconception),
      dureeMs: reponse.dureeMs,
    }));
}

function reponseLisible(
  reponse: AnswerRecord,
  libelles: LibellesDesOptions,
): string {
  if (reponse.valeur === NE_SAIT_PAS) {
    return LIBELLE_NE_SAIT_PAS;
  }
  const valeur = String(reponse.valeur);
  if (!Object.hasOwn(libelles, reponse.questionId)) {
    return valeur;
  }
  const options = libelles[reponse.questionId];
  return Object.hasOwn(options, valeur) ? options[valeur] : valeur;
}

function libellesDuTirage(
  input: SessionReportInput,
  graine: number,
): LibellesDesOptions {
  if (input.cours === null) {
    return {};
  }
  const stockees = solutionsDuTirage(input.session.bareme, graine);
  const tirage = tirer(input.cours, graine);
  return solutionsIdentiques(tirage.solutions, stockees)
    ? tirage.libellesOptions
    : {};
}

function signalerTiragesEnEchec(
  input: SessionReportInput,
  erreurs: readonly string[],
): void {
  if (erreurs.length === 0) {
    return;
  }
  input.avertir(
    `Libelles des options indisponibles pour ${erreurs.length} participant(s) de la seance ${input.session.id} (cours ${input.session.courseSlug}, ${[...new Set(erreurs)].join(', ')}) : leurs reponses gardent l identifiant de l option`,
  );
}

function nomDErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.name : typeof erreur;
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
