import { moyenneOu } from '../../../common/domain/nombres/statistiques';
import type { QuestionDeBareme } from './Bareme';
import {
  questionsAAgreger,
  questionsNotees,
  solutionsDuTirage,
  solutionsIdentiques,
} from './Bareme';
import { libelleDeConcept } from './cours/banque/concepts';
import { libelleLisible } from './cours/banque/confusions';
import type { Cours, TypeQuestion } from './contrats/cours';
import type { DetailProduction, ValeurProduction } from './contrats/resultats';
import { activitesLibres } from './cours/EcranServi';
import { tirer } from './cours/Tirage';
import type { LibellesDesOptions } from './cours/Tirage';
import { computeCohortScore } from './CompletionScore';
import { NE_SAIT_PAS } from './GradingCore';
import type { AnswerRecord } from './IAnswers.repository';
import type {
  RapportParticipant,
  RapportQuestion,
  RapportReponseLibre,
  RapportSession,
} from './IFormationMailer.port';
import type { FreeResponseRecord } from './IFreeResponses.repository';
import type { IncidentRecord } from './IIncidents.repository';
import type { ParticipantRecord } from './IParticipants.repository';
import type { SessionRecord } from './ISessions.repository';
import { REGLE_DE_NOTATION } from './RegleDeNotation';
import { estUneProduction, texteDeValeur } from './ValeurReponse';

const SEUIL_CONCEPT_FRAGILE = 0.7;
const LIBELLE_NE_SAIT_PAS = 'Je ne sais pas';
const POINT_PAR_QUESTION_REPONDUE = 1;

export interface SessionReportInput {
  session: SessionRecord;
  cours: Cours | null;
  participants: readonly ParticipantRecord[];
  answers: readonly AnswerRecord[];
  incidents: readonly IncidentRecord[];
  reponsesLibres: readonly FreeResponseRecord[];
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
  const types = new Map(
    questionsAAgreger(input.session.bareme, input.cours).map((question) => [
      question.id,
      question.type,
    ]),
  );
  const rangDeLibre = rangsDesActivitesLibres(input.cours);
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
          types,
        ),
        reponsesLibres: reponsesLibresDe(participant.id, input, rangDeLibre),
        incidents: input.incidents.filter(
          (incident) => incident.participantId === participant.id,
        ).length,
      };
    },
  );
  signalerTiragesEnEchec(input, tiragesEnEchec);
  const conceptsFragiles = conceptsFragilesDe(input.answers);

  return {
    courseSlug: input.session.courseSlug,
    code: input.session.code,
    ouverteLe: input.session.ouverteLe,
    fermeeLe: input.session.fermeeLe ?? new Date(),
    participants,
    conceptsFragiles,
    libellesDesConcepts: Object.fromEntries(
      conceptsFragiles.map((concept) => [concept, libelleDeConcept(concept)]),
    ),
  };
}

function completionDe(
  participantId: string,
  reponses: readonly AnswerRecord[],
  notees: readonly QuestionDeBareme[],
): number {
  return moyenneOu(
    notees.map((question) =>
      reponses.some(
        (reponse) =>
          reponse.participantId === participantId &&
          reponse.questionId === question.id &&
          compteCommeReponse(reponse),
      )
        ? POINT_PAR_QUESTION_REPONDUE
        : REGLE_DE_NOTATION.pointsNonReponse,
    ),
    0,
  );
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
  types: ReadonlyMap<string, TypeQuestion>,
): readonly RapportQuestion[] {
  const rangDe = (reponse: AnswerRecord): number =>
    rangs.get(reponse.questionId) ?? rangs.size;
  return reponses
    .filter((reponse) => reponse.participantId === participantId)
    .sort((premiere, seconde) => rangDe(premiere) - rangDe(seconde))
    .map((reponse) => ({
      questionId: reponse.questionId,
      concept: reponse.concept,
      type: types.get(reponse.questionId) ?? 'vote',
      score: reponse.score,
      valeur: texteDeValeur(reponse.valeur),
      reponse: reponseLisible(reponse, libelles),
      correcte: reponse.correcte,
      misconception: reponse.misconception,
      libelleConfusion: libelleLisible(reponse.misconception),
      dureeMs: reponse.dureeMs,
    }));
}

type RangDeLibre = (libre: FreeResponseRecord) => readonly [number, number];

function rangsDesActivitesLibres(cours: Cours | null): RangDeLibre {
  if (cours === null) {
    return () => [0, 0];
  }
  const libres = activitesLibres(cours);
  const rangDEcran = new Map(
    cours.ecrans.map((ecran, rang) => [ecran.id, rang]),
  );
  return (libre) => {
    const activites = libres.get(libre.screenId) ?? [];
    const rangDActivite = activites.indexOf(libre.activityId);
    return [
      rangDEcran.get(libre.screenId) ?? cours.ecrans.length,
      rangDActivite < 0 ? activites.length : rangDActivite,
    ];
  };
}

function reponsesLibresDe(
  participantId: string,
  input: SessionReportInput,
  rangDe: RangDeLibre,
): readonly RapportReponseLibre[] {
  const comparer = (
    premiere: FreeResponseRecord,
    seconde: FreeResponseRecord,
  ): number => {
    const [ecranPremiere, activitePremiere] = rangDe(premiere);
    const [ecranSeconde, activiteSeconde] = rangDe(seconde);
    return ecranPremiere - ecranSeconde || activitePremiere - activiteSeconde;
  };
  return input.reponsesLibres
    .filter((libre) => libre.participantId === participantId)
    .sort(comparer)
    .map((libre) => ({
      screenId: libre.screenId,
      activityId: libre.activityId,
      reponse: libre.response,
    }));
}

const LIBELLE_PAR_TYPE: Readonly<Record<string, string>> = {
  feuille: 'Feuille',
  tableau: 'Tableau',
  classement: 'Classement',
};

const UNITE_PAR_TYPE: Readonly<Record<string, string>> = {
  feuille: 'cellules justes',
  tableau: 'lignes justes',
  classement: 'cartes bien placées',
};

function productionLisible(
  valeur: ValeurProduction,
  details: readonly DetailProduction[] | null,
): string {
  const titre = LIBELLE_PAR_TYPE[valeur.type] ?? valeur.type;
  if ('neSaitPas' in valeur || details === null) {
    return `${titre} : ${LIBELLE_NE_SAIT_PAS.toLowerCase()}`;
  }
  const justes = details.filter((detail) => detail.juste).length;
  return `${titre} : ${justes}/${details.length} ${UNITE_PAR_TYPE[valeur.type] ?? 'attendus justes'}`;
}

function reponseLisible(
  reponse: AnswerRecord,
  libelles: LibellesDesOptions,
): string {
  if (estUneProduction(reponse.valeur)) {
    return productionLisible(reponse.valeur, reponse.details);
  }
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
