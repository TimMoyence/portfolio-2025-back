import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IMasteryRepository,
  MasteryRecord,
  TentativeDeMaitrise,
} from '../domain/IMastery.repository';
import { BOITE_MAX, BOITE_MIN } from '../domain/LeitnerBox';
import { DepotEnDomaine } from '../../../common/infrastructure/typeorm/DepotEnDomaine';
import { FormationMasteryEntity } from './entities/FormationMastery.entity';

@Injectable()
export class MasteryRepositoryTypeORM
  extends DepotEnDomaine<FormationMasteryEntity, MasteryRecord>
  implements IMasteryRepository
{
  constructor(
    @InjectRepository(FormationMasteryEntity)
    repo: Repository<FormationMasteryEntity>,
  ) {
    super(repo);
  }

  findByStudentKey(studentKey: string): Promise<readonly MasteryRecord[]> {
    return this.lister({ where: { studentKey } });
  }

  async enregistrerTentative(tentative: TentativeDeMaitrise): Promise<void> {
    await this.repo.query(
      `INSERT INTO formation_mastery
         (student_key, concept, boite, succes, echecs)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_key, concept) DO UPDATE
         SET boite = CASE
               WHEN $6 THEN LEAST(formation_mastery.boite + 1, $7)
               ELSE $8
             END,
             succes = formation_mastery.succes + EXCLUDED.succes,
             echecs = formation_mastery.echecs + EXCLUDED.echecs`,
      [
        tentative.studentKey,
        tentative.concept,
        tentative.reussi ? BOITE_MIN + 1 : BOITE_MIN,
        tentative.reussi ? 1 : 0,
        tentative.reussi ? 0 : 1,
        tentative.reussi,
        BOITE_MAX,
        BOITE_MIN,
      ],
    );
  }

  protected toDomain(entity: FormationMasteryEntity): MasteryRecord {
    return {
      studentKey: entity.studentKey,
      concept: entity.concept,
      boite: entity.boite,
      succes: entity.succes,
      echecs: entity.echecs,
    };
  }
}
