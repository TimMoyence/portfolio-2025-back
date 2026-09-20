export interface ParticipantRecord {
  id: string;
  sessionId: string;
  studentKey: string;
  prenom: string;
  nom: string;
  email: string;
  groupId?: string | null;
  seed: number;
  rejointLe: Date;
  dernierPing: Date;
  evinceLe: Date | null;
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
  countBySession(sessionId: string): Promise<number>;
  listSeedsBySession(sessionId: string): Promise<readonly number[]>;
  touch(id: string): Promise<void>;
  evincer(sessionId: string, participantId: string): Promise<boolean>;
}
