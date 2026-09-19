export interface FormationGroupRecord {
  id: string;
  sessionId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormationGroupsRepository {
  create(sessionId: string, name: string): Promise<FormationGroupRecord>;
  rename(
    sessionId: string,
    groupId: string,
    name: string,
  ): Promise<FormationGroupRecord>;
  listBySession(sessionId: string): Promise<readonly FormationGroupRecord[]>;
  assignParticipant(
    sessionId: string,
    participantId: string,
    groupId: string | null,
  ): Promise<void>;
}
