import type { TypeQuestion } from './contrats/cours';
import type { IncidentType, ValeurDeContexte } from './IncidentType';

export interface RapportQuestion {
  questionId: string;
  concept: string;
  type: TypeQuestion;
  score: number | null;
  valeur: string;
  reponse: string;
  correcte: boolean;
  misconception: string | null;
  libelleConfusion: string | null;
  dureeMs: number;
}

export interface RapportParticipant {
  prenom: string;
  nom: string;
  email: string;
  completion: number;
  reponses: readonly RapportQuestion[];
  reponsesLibres: readonly RapportReponseLibre[];
  incidents: readonly RapportIncident[];
}

export interface RapportIncident {
  type: IncidentType;
  horodatage: string;
  contexte: Readonly<Record<string, ValeurDeContexte>> | null;
}

export interface RapportReponseLibre {
  screenId: string;
  activityId: string;
  reponse: string;
}

export interface RapportSession {
  courseSlug: string;
  code: string;
  ouverteLe: Date;
  fermeeLe: Date | null;
  participants: readonly RapportParticipant[];
  conceptsFragiles: readonly string[];
  libellesDesConcepts: Readonly<Record<string, string>>;
}

export function conceptsFragilesLisibles(rapport: RapportSession): string {
  return rapport.conceptsFragiles
    .map((concept) => rapport.libellesDesConcepts[concept] ?? concept)
    .join(', ');
}

/**
 * La copie d un etudiant ne porte que sa propre copie. Le rapport complet
 * — nom, adresse et completion de chaque camarade — reste a la synthese du
 * formateur : le jour ou le corps du message gagnera un classement, la
 * donnee des autres ne sera pas deja dans la main de celui qui redige
 * (CloseSession.useCase.ts).
 */
export interface CopieEtudiant {
  courseSlug: string;
  code: string;
  participant: RapportParticipant;
}

export interface IFormationMailer {
  sendSyntheseFormateur(
    destinataire: string,
    rapport: RapportSession,
  ): Promise<void>;
  sendCopieEtudiant(copie: CopieEtudiant): Promise<void>;
}
