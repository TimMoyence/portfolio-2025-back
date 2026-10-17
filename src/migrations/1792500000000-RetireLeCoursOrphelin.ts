import { MigrationInterface, QueryRunner } from 'typeorm';

const ANCIEN_B2_02 = 'b2-02-serie-statistique-une-variable';

const IMMUTABILITE_DES_VERSIONS = [
  ['formation_screen_contents', 'trg_formation_screen_immutable'],
  ['formation_course_contents', 'trg_formation_course_immutable'],
] as const;

async function basculerLImmutabilite(
  queryRunner: QueryRunner,
  etat: 'DISABLE' | 'ENABLE',
): Promise<void> {
  for (const [table, declencheur] of IMMUTABILITE_DES_VERSIONS) {
    await queryRunner.query(
      `ALTER TABLE "${table}" ${etat} TRIGGER "${declencheur}"`,
    );
  }
}

export class RetireLeCoursOrphelin1792500000000 implements MigrationInterface {
  name = 'RetireLeCoursOrphelin1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "formation_course_publications" WHERE "slug" = $1`,
      [ANCIEN_B2_02],
    );
    await basculerLImmutabilite(queryRunner, 'DISABLE');
    await queryRunner.query(
      `DELETE FROM "formation_screen_contents" WHERE "course_id" IN
         (SELECT "id" FROM "formation_course_contents" WHERE "slug" = $1)`,
      [ANCIEN_B2_02],
    );
    await queryRunner.query(
      `DELETE FROM "formation_course_contents" WHERE "slug" = $1`,
      [ANCIEN_B2_02],
    );
    await basculerLImmutabilite(queryRunner, 'ENABLE');
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Retrait definitif de l ancien B2-02 : ce slug n a plus de contenu dans le depot et n est plus servi.',
      ),
    );
  }
}
