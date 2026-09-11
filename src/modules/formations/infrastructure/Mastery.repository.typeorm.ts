import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IMasteryRepository,
  MasteryRecord,
} from '../domain/IMastery.repository';
import { FormationMasteryEntity } from './entities/FormationMastery.entity';

@Injectable()
export class MasteryRepositoryTypeORM implements IMasteryRepository {
  constructor(
    @InjectRepository(FormationMasteryEntity)
    private readonly repo: Repository<FormationMasteryEntity>,
  ) {}

  async findByStudentKey(
    studentKey: string,
  ): Promise<readonly MasteryRecord[]> {
    const entities = await this.repo.find({ where: { studentKey } });
    return entities.map((entity) => this.toDomain(entity));
  }

  async upsert(record: MasteryRecord): Promise<void> {
    await this.repo.upsert(
      {
        studentKey: record.studentKey,
        concept: record.concept,
        boite: record.boite,
        derniereVue: record.derniereVue,
        succes: record.succes,
        echecs: record.echecs,
      },
      ['studentKey', 'concept'],
    );
  }

  private toDomain(entity: FormationMasteryEntity): MasteryRecord {
    return {
      studentKey: entity.studentKey,
      concept: entity.concept,
      boite: entity.boite,
      derniereVue: entity.derniereVue,
      succes: entity.succes,
      echecs: entity.echecs,
    };
  }
}
