import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  FreeResponseRecord,
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import { FormationFreeResponseEntity } from './entities/FormationFreeResponse.entity';

const CLE_REPONSE_LIBRE = ['sessionId', 'participantId', 'activityId'];

@Injectable()
export class FreeResponsesRepositoryTypeORM implements IFreeResponsesRepository {
  constructor(
    @InjectRepository(FormationFreeResponseEntity)
    private readonly repo: Repository<FormationFreeResponseEntity>,
  ) {}

  async save(input: SaveFreeResponseInput): Promise<void> {
    await this.repo.upsert(
      {
        sessionId: input.sessionId,
        participantId: input.participantId,
        screenId: input.screenId,
        activityId: input.activityId,
        response: input.response,
        dureeMs: input.dureeMs,
        status: 'enregistre',
      },
      CLE_REPONSE_LIBRE,
    );
  }

  async listBySession(
    sessionId: string,
  ): Promise<readonly FreeResponseRecord[]> {
    const rows = await this.repo.find({
      where: { sessionId },
      order: { submittedAt: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: FormationFreeResponseEntity): FreeResponseRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      participantId: row.participantId,
      screenId: row.screenId,
      activityId: row.activityId,
      response: row.response,
      dureeMs: row.dureeMs,
      status: row.status,
      submittedAt: row.submittedAt,
    };
  }
}
