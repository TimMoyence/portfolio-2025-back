import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IndividualScoreSnapshot,
  IScoresRepository,
  SessionScoreSnapshot,
} from '../domain/IScores.repository';
import { FormationScoreEntity } from './entities/FormationScore.entity';

const CLE_SCORE_INDIVIDUEL = ['sessionId', 'participantId', 'kind'];
const CLE_SCORE_DE_SEANCE = ['sessionId', 'kind'];
const PREDICAT_INDEX_SCORE_DE_SEANCE = '"participant_id" IS NULL';

@Injectable()
export class ScoresRepositoryTypeORM implements IScoresRepository {
  constructor(
    @InjectRepository(FormationScoreEntity)
    private readonly repo: Repository<FormationScoreEntity>,
  ) {}

  async saveIndividuals(
    scores: readonly IndividualScoreSnapshot[],
  ): Promise<void> {
    if (scores.length === 0) {
      return;
    }
    await this.repo.upsert(
      scores.map((score) => ({
        sessionId: score.sessionId,
        participantId: score.participantId,
        kind: 'individual' as const,
        score: score.note,
        percentage: score.completion,
        metrics: {},
      })),
      CLE_SCORE_INDIVIDUEL,
    );
  }

  async saveSession(score: SessionScoreSnapshot): Promise<void> {
    await this.repo.upsert(
      {
        sessionId: score.sessionId,
        participantId: null,
        kind: 'session',
        score: score.moyenne,
        percentage: score.tauxReussite,
        metrics: {
          mediane: score.mediane,
          dispersion: score.dispersion,
          tauxParticipation: score.tauxParticipation,
          questionsProblemes: score.questionsProblemes,
        },
      },
      {
        conflictPaths: CLE_SCORE_DE_SEANCE,
        indexPredicate: PREDICAT_INDEX_SCORE_DE_SEANCE,
      },
    );
  }
}
