import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IMasteryRepository,
  MasteryRecord,
  TentativeDeMaitrise,
} from '../domain/IMastery.repository';
import { BOITE_MAX, BOITE_MIN } from '../domain/LeitnerBox';
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

  async enregistrerTentative(tentative: TentativeDeMaitrise): Promise<void> {
    await this.repo.query(
      `INSERT INTO formation_mastery
         (student_key, concept, boite, derniere_vue, succes, echecs)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_key, concept) DO UPDATE
         SET boite = CASE
               WHEN $7 THEN LEAST(formation_mastery.boite + 1, $8)
               ELSE $9
             END,
             derniere_vue = EXCLUDED.derniere_vue,
             succes = formation_mastery.succes + EXCLUDED.succes,
             echecs = formation_mastery.echecs + EXCLUDED.echecs`,
      [
        tentative.studentKey,
        tentative.concept,
        tentative.reussi ? BOITE_MIN + 1 : BOITE_MIN,
        tentative.vueLe,
        tentative.reussi ? 1 : 0,
        tentative.reussi ? 0 : 1,
        tentative.reussi,
        BOITE_MAX,
        BOITE_MIN,
      ],
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
