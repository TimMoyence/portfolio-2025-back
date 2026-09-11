import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IIncidentsRepository,
  IncidentInput,
  IncidentRecord,
} from '../domain/IIncidents.repository';
import { FormationIncidentEntity } from './entities/FormationIncident.entity';

@Injectable()
export class IncidentsRepositoryTypeORM implements IIncidentsRepository {
  constructor(
    @InjectRepository(FormationIncidentEntity)
    private readonly repo: Repository<FormationIncidentEntity>,
  ) {}

  async createMany(inputs: readonly IncidentInput[]): Promise<void> {
    if (inputs.length === 0) return;
    const entities = inputs.map((input) =>
      this.repo.create({
        sessionId: input.sessionId,
        participantId: input.participantId,
        type: input.type,
        contexte: input.contexte,
        horodatage: input.horodatage,
      }),
    );
    await this.repo.save(entities);
  }

  async listBySession(sessionId: string): Promise<readonly IncidentRecord[]> {
    const entities = await this.repo.find({ where: { sessionId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: FormationIncidentEntity): IncidentRecord {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      participantId: entity.participantId,
      type: entity.type,
      contexte: entity.contexte,
      horodatage: entity.horodatage,
    };
  }
}
