import type { StatistiquesSeance } from './SessionStatistics';

export interface IndividualScoreSnapshot {
  readonly sessionId: string;
  readonly participantId: string;
  readonly note: number;
  readonly completion: number;
}

export interface SessionScoreSnapshot extends StatistiquesSeance {
  readonly sessionId: string;
}

export interface IScoresRepository {
  saveIndividuals(scores: readonly IndividualScoreSnapshot[]): Promise<void>;
  saveSession(score: SessionScoreSnapshot): Promise<void>;
}
