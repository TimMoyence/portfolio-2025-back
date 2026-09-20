import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IRappelsServisRepository,
  RappelServiRecord,
} from '../domain/IRappelsServis.repository';
import { FormationRappelServiEntity } from './entities/FormationRappelServi.entity';

@Injectable()
export class RappelsServisRepositoryTypeORM implements IRappelsServisRepository {
  constructor(
    @InjectRepository(FormationRappelServiEntity)
    private readonly repo: Repository<FormationRappelServiEntity>,
  ) {}

  async lister(participantId: string): Promise<readonly RappelServiRecord[]> {
    const lignes = await this.repo.find({
      where: { participantId },
      order: { rang: 'ASC' },
    });
    return lignes.map((ligne) => this.toDomain(ligne));
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
    return this.lister(input.participantId);
  }

  private toDomain(ligne: FormationRappelServiEntity): RappelServiRecord {
    return {
      participantId: ligne.participantId,
      questionId: ligne.questionId,
      rang: ligne.rang,
    };
  }
}
