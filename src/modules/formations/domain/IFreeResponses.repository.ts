export type FreeResponseStatus = 'enregistre' | 'en_attente' | 'echec';

export interface FreeResponseRecord {
  id: string;
  sessionId: string;
  participantId: string;
  screenId: string;
  activityId: string;
  response: string;
  dureeMs: number;
  status: FreeResponseStatus;
  submittedAt: Date;
}

export interface SaveFreeResponseInput {
  sessionId: string;
  participantId: string;
  screenId: string;
  activityId: string;
  response: string;
  dureeMs: number;
}

export interface IFreeResponsesRepository {
  save(input: SaveFreeResponseInput): Promise<void>;
  listBySession(sessionId: string): Promise<readonly FreeResponseRecord[]>;
}
