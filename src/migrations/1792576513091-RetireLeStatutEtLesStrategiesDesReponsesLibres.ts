import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetireLeStatutEtLesStrategiesDesReponsesLibres1792576513091 implements MigrationInterface {
  name = 'RetireLeStatutEtLesStrategiesDesReponsesLibres1792576513091';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" DROP CONSTRAINT "CHK_formation_free_responses_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" DROP COLUMN "strategies_servies_le"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" ADD "strategies_servies_le" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" ADD "status" character varying(20) NOT NULL DEFAULT 'enregistre'`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" ADD CONSTRAINT "CHK_formation_free_responses_status" CHECK ("status" IN ('enregistre', 'en_attente', 'echec'))`,
    );
  }
}
