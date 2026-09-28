import { MigrationInterface, QueryRunner } from 'typeorm';

export class AjouteGabaritDuCours1790900000002 implements MigrationInterface {
  name = 'AjouteGabaritDuCours1790900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD "gabarit" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP COLUMN "gabarit"`,
    );
  }
}
