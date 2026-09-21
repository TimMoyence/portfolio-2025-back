import { MigrationInterface, QueryRunner } from 'typeorm';
import { ouvrirTirages } from '../modules/formations/domain/cours/OuvertureTirages';
import { CoursCatalogueRepositoryTypeORM } from '../modules/formations/infrastructure/CoursCatalogue.repository.typeorm';
import { FormationCourseContentEntity } from '../modules/formations/infrastructure/entities/FormationCourseContent.entity';
import { FormationCoursePublicationEntity } from '../modules/formations/infrastructure/entities/FormationCoursePublication.entity';

const COURSE_SLUG = 'b2-01-traitement-information-chiffree';

export class BackfillB2OpenSessionBaremes1779600000000 implements MigrationInterface {
  name = 'BackfillB2OpenSessionBaremes1779600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const catalogue = new CoursCatalogueRepositoryTypeORM(
      queryRunner.manager.getRepository(FormationCourseContentEntity),
      queryRunner.manager.getRepository(FormationCoursePublicationEntity),
    );
    const cours = await catalogue.trouver(COURSE_SLUG);
    if (cours === null) {
      return;
    }
    const bareme = ouvrirTirages(cours);
    const sessions: unknown = await queryRunner.query(
      `SELECT "id"
       FROM "formation_sessions"
       WHERE "course_slug" = $1
         AND "etat" IN ('attente', 'en_cours')
         AND COALESCE(jsonb_array_length("bareme"->'questions'), 0) = 0`,
      [COURSE_SLUG],
    );
    if (!Array.isArray(sessions)) {
      return;
    }
    for (const session of sessions) {
      if (typeof session !== 'object' || session === null) {
        continue;
      }
      const id = (session as Record<string, unknown>)['id'];
      if (typeof id !== 'string') {
        continue;
      }
      await queryRunner.query(
        `UPDATE "formation_sessions"
         SET "bareme" = $1::jsonb
         WHERE "id" = $2`,
        [JSON.stringify(bareme), id],
      );
    }
  }

  down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Migration de données irréversible : BackfillB2OpenSessionBaremes ne garde pas la liste des séances complétées ; vider leur barème toucherait aussi les séances B2 ouvertes depuis.',
      ),
    );
  }
}
