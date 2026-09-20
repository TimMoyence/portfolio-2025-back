export type FreeResponseStatus = 'enregistre' | 'en_attente' | 'echec';

export interface FreeResponseRecord {
  id: string;
  sessionId: string;
  participantId: string;
  screenId: string;
  activityId: string;
  response: string;
  premiereReponse: string | null;
  strategiesServiesLe: Date | null;
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
  enregistrerTentativeDeDefi(
    input: SaveFreeResponseInput,
  ): Promise<FreeResponseRecord>;
  trouverParActivite(
    participantId: string,
    activityId: string,
  ): Promise<FreeResponseRecord | null>;
  listBySession(sessionId: string): Promise<readonly FreeResponseRecord[]>;
  listerDuParticipant(
    sessionId: string,
    participantId: string,
  ): Promise<readonly FreeResponseRecord[]>;
}
