import { MigrationInterface, QueryRunner } from 'typeorm';

export class AjouteGenerationDeJeton1790900000000 implements MigrationInterface {
  name = 'AjouteGenerationDeJeton1790900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_participants" ADD "generation_de_jeton" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_participants" DROP COLUMN "generation_de_jeton"`,
    );
  }
}
