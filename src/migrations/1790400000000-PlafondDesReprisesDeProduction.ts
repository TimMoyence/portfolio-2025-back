import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlafondDesReprisesDeProduction1790400000000 implements MigrationInterface {
  name = 'PlafondDesReprisesDeProduction1790400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_answers" ADD "soumissions" integer NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_answers" DROP COLUMN "soumissions"`,
    );
  }
}
