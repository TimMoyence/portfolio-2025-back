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
}

export interface CreateParticipantInput {
  sessionId: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  seed: number;
}

export interface IParticipantsRepository {
  create(input: CreateParticipantInput): Promise<ParticipantRecord>;
  findBySessionAndStudentKey(
    sessionId: string,
    studentKey: string,
  ): Promise<ParticipantRecord | null>;
  findById(id: string): Promise<ParticipantRecord | null>;
  listBySession(sessionId: string): Promise<readonly ParticipantRecord[]>;
  listSeedsBySession(sessionId: string): Promise<readonly number[]>;
  touch(id: string): Promise<void>;
}
