import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IIncidentsRepository,
  IncidentInput,
  IncidentRecord,
} from '../domain/IIncidents.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationIncidentEntity } from './entities/FormationIncident.entity';

@Injectable()
export class IncidentsRepositoryTypeORM
  extends DepotEnDomaine<FormationIncidentEntity, IncidentRecord>
  implements IIncidentsRepository
{
  constructor(
    @InjectRepository(FormationIncidentEntity)
    repo: Repository<FormationIncidentEntity>,
  ) {
    super(repo);
  }

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

  listBySession(sessionId: string): Promise<readonly IncidentRecord[]> {
    return this.lister({ where: { sessionId } });
  }

  protected toDomain(entity: FormationIncidentEntity): IncidentRecord {
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
