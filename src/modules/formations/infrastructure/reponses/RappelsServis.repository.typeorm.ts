import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IRappelsServisRepository,
  RappelServiRecord,
} from '../../domain/progression/IRappelsServis.repository';
import { DepotEnDomaine } from '../../../../common/infrastructure/typeorm/depots/DepotEnDomaine';
import { FormationRappelServiEntity } from '../entities/reponses/FormationRappelServi.entity';

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
