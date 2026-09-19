export interface IndividualScoreSnapshot {
  sessionId: string;
  participantId: string;
  score: number;
  percentage: number;
  updatedAt: Date;
}

export interface SessionScoreSnapshot {
  sessionId: string;
  moyenne: number;
  mediane: number;
  dispersion: number;
  tauxParticipation: number;
  tauxReussite: number;
  questionsProblemes: readonly string[];
  updatedAt: Date;
}

export interface IScoresRepository {
  saveIndividual(
    input: Omit<IndividualScoreSnapshot, 'updatedAt'>,
  ): Promise<void>;
  saveSession(input: Omit<SessionScoreSnapshot, 'updatedAt'>): Promise<void>;
  listBySession(sessionId: string): Promise<readonly IndividualScoreSnapshot[]>;
  findSession(sessionId: string): Promise<SessionScoreSnapshot | null>;
}
