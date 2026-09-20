export interface RappelServiRecord {
  readonly participantId: string;
  readonly questionId: string;
  readonly rang: number;
}

export interface IRappelsServisRepository {
  lister(participantId: string): Promise<readonly RappelServiRecord[]>;
  figer(input: {
    readonly sessionId: string;
    readonly participantId: string;
    readonly questionIds: readonly string[];
  }): Promise<readonly RappelServiRecord[]>;
}
