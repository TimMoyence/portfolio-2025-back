import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IRappelsServisRepository,
  RappelServiRecord,
} from '../domain/IRappelsServis.repository';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationRappelServiEntity } from './entities/FormationRappelServi.entity';

@Injectable()
export class RappelsServisRepositoryTypeORM
  extends DepotEnDomaine<FormationRappelServiEntity, RappelServiRecord>
  implements IRappelsServisRepository
{
  constructor(
    @InjectRepository(FormationRappelServiEntity)
    repo: Repository<FormationRappelServiEntity>,
  ) {
    super(repo);
  }

  listerDuParticipant(
    participantId: string,
  ): Promise<readonly RappelServiRecord[]> {
    return this.lister({
      where: { participantId },
      order: { rang: 'ASC' },
    });
  }

  async figer(input: {
    readonly sessionId: string;
    readonly participantId: string;
    readonly questionIds: readonly string[];
  }): Promise<readonly RappelServiRecord[]> {
    if (input.questionIds.length > 0) {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(FormationRappelServiEntity)
        .values(
          input.questionIds.map((questionId, rang) => ({
            sessionId: input.sessionId,
            participantId: input.participantId,
            questionId,
            rang,
          })),
        )
        .orIgnore()
        .execute();
    }
    return this.listerDuParticipant(input.participantId);
  }

  protected toDomain(ligne: FormationRappelServiEntity): RappelServiRecord {
    return {
      participantId: ligne.participantId,
      questionId: ligne.questionId,
      rang: ligne.rang,
    };
  }
}
