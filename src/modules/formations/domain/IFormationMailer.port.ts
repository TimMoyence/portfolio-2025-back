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

export interface IFormationMailer {
  sendSyntheseFormateur(
    destinataire: string,
    rapport: RapportSession,
  ): Promise<void>;
  sendCopieEtudiant(
    participant: RapportParticipant,
    rapport: RapportSession,
    lienRevision: string,
  ): Promise<void>;
}
