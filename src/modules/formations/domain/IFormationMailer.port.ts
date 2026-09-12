export interface RapportQuestion {
  questionId: string;
  concept: string;
  valeur: string;
  correcte: boolean;
  misconception: string | null;
  dureeMs: number;
}

export interface RapportParticipant {
  prenom: string;
  nom: string;
  email: string;
  completion: number;
  note: number;
  sousSeuil: boolean;
  reponses: readonly RapportQuestion[];
  incidents: number;
}

export interface RapportSession {
  courseSlug: string;
  code: string;
  ouverteLe: Date;
  fermeeLe: Date;
  participants: readonly RapportParticipant[];
  conceptsFragiles: readonly string[];
}

/**
 * La copie d un etudiant ne porte que sa propre copie. Le rapport complet
 * — nom, adresse et note de chaque camarade — reste a la synthese du
 * formateur : le jour ou le corps du message gagnera un classement, la
 * donnee des autres ne sera pas deja dans la main de celui qui redige
 * (CloseSession.useCase.ts).
 */
export interface CopieEtudiant {
  courseSlug: string;
  code: string;
  participant: RapportParticipant;
  lienRevision: string;
}

export interface IFormationMailer {
  sendSyntheseFormateur(
    destinataire: string,
    rapport: RapportSession,
  ): Promise<void>;
  sendCopieEtudiant(copie: CopieEtudiant): Promise<void>;
}
