export interface IncidentInput {
  sessionId: string;
  participantId: string;
  type: string;
  contexte: Record<string, unknown> | null;
  horodatage: Date;
}

export interface IncidentRecord extends IncidentInput {
  id: string;
}

export interface IIncidentsRepository {
  createMany(inputs: readonly IncidentInput[]): Promise<void>;
  listBySession(sessionId: string): Promise<readonly IncidentRecord[]>;
}
