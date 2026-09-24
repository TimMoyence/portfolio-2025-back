export interface ParticipantRecord {
  id: string;
  sessionId: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  seed: number;
  rejointLe: Date;
  dernierPing: Date;
  evinceLe: Date | null;
  generationDeJeton: number;
}

export interface InscriptionInput {
  sessionId: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  capacite: number;
  empreinteDeReprise: string;
  repriseAutorisee: (empreinteStockee: string | null) => boolean;
  choisirGraine: (grainesPrises: readonly number[]) => number | null;
}

export interface Inscription {
  readonly participant: ParticipantRecord;
  readonly nouveau: boolean;
}

export interface IParticipantsRepository {
  inscrire(input: InscriptionInput): Promise<Inscription>;
  findBySessionAndStudentKey(
    sessionId: string,
    studentKey: string,
  ): Promise<ParticipantRecord | null>;
  findById(id: string): Promise<ParticipantRecord | null>;
  listBySession(sessionId: string): Promise<readonly ParticipantRecord[]>;
  listEvincesBySession(
    sessionId: string,
  ): Promise<readonly ParticipantRecord[]>;
  countBySession(sessionId: string): Promise<number>;
  touch(id: string): Promise<void>;
  evincer(sessionId: string, participantId: string): Promise<boolean>;
  readmettre(
    sessionId: string,
    participantId: string,
    capacite: number,
  ): Promise<boolean>;
  libererPoste(sessionId: string, participantId: string): Promise<boolean>;
}
