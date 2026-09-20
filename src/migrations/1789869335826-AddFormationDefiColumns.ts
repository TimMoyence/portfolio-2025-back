import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationDefiColumns1789869335826 implements MigrationInterface {
  name = 'AddFormationDefiColumns1789869335826';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" ADD "premiere_reponse" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" ADD "strategies_servies_le" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" DROP COLUMN "strategies_servies_le"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_free_responses" DROP COLUMN "premiere_reponse"`,
    );
  }
}
