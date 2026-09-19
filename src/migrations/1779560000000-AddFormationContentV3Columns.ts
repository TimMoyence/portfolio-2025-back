import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationContentV3Columns1779560000000 implements MigrationInterface {
  name = 'AddFormationContentV3Columns1779560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD "remediations" jsonb NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" ADD "medias" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD "titre" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD "diffusion" character varying(10) NOT NULL DEFAULT 'catalogue'`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" ADD CONSTRAINT "chk_formation_screen_diffusion" CHECK ("diffusion" IN ('catalogue', 'seance'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP CONSTRAINT "chk_formation_screen_diffusion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP COLUMN "diffusion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_screen_contents" DROP COLUMN "titre"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP COLUMN "medias"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_course_contents" DROP COLUMN "remediations"`,
    );
  }
}
