import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IndividualScoreSnapshot,
  IScoresRepository,
  SessionScoreSnapshot,
} from '../domain/IScores.repository';
import { FormationScoreEntity } from './entities/FormationScore.entity';

@Injectable()
export class ScoresRepositoryTypeORM implements IScoresRepository {
  constructor(
    @InjectRepository(FormationScoreEntity)
    private readonly repo: Repository<FormationScoreEntity>,
  ) {}

  async saveIndividual(
    input: Omit<IndividualScoreSnapshot, 'updatedAt'>,
  ): Promise<void> {
    await this.repo.upsert(
      {
        sessionId: input.sessionId,
        participantId: input.participantId,
        kind: 'individual',
        score: input.score,
        percentage: input.percentage,
        metrics: {},
      },
      ['sessionId', 'participantId', 'kind'],
    );
  }

  async saveSession(
    input: Omit<SessionScoreSnapshot, 'updatedAt'>,
  ): Promise<void> {
    const values = {
      sessionId: input.sessionId,
      participantId: null,
      kind: 'session' as const,
      score: input.moyenne,
      percentage: input.tauxReussite,
      metrics: {
        mediane: input.mediane,
        dispersion: input.dispersion,
        tauxParticipation: input.tauxParticipation,
        questionsProblemes: input.questionsProblemes,
      },
    };
    const existing = await this.repo.findOne({
      where: { sessionId: input.sessionId, kind: 'session' },
    });
    if (existing) {
      await this.repo.update(existing.id, values);
    } else {
      await this.repo.save(this.repo.create(values));
    }
  }

  async listBySession(
    sessionId: string,
  ): Promise<readonly IndividualScoreSnapshot[]> {
    const rows = await this.repo.find({
      where: { sessionId, kind: 'individual' },
      order: { updatedAt: 'ASC', participantId: 'ASC' },
    });
    return rows.map((row) => ({
      sessionId: row.sessionId,
      participantId: row.participantId as string,
      score: row.score,
      percentage: row.percentage,
      updatedAt: row.updatedAt,
    }));
  }

  async findSession(sessionId: string): Promise<SessionScoreSnapshot | null> {
    const row = await this.repo.findOne({
      where: { sessionId, kind: 'session' },
    });
    if (!row) return null;
    const metrics = row.metrics;
    return {
      sessionId: row.sessionId,
      moyenne: row.score,
      mediane: Number(metrics['mediane'] ?? 0),
      dispersion: Number(metrics['dispersion'] ?? 0),
      tauxParticipation: Number(metrics['tauxParticipation'] ?? 0),
      tauxReussite: row.percentage,
      questionsProblemes: Array.isArray(metrics['questionsProblemes'])
        ? metrics['questionsProblemes'].filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      updatedAt: row.updatedAt,
    };
  }
}
