import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationAnswerProduction1789862782667 implements MigrationInterface {
  name = 'AddFormationAnswerProduction1789862782667';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "formation_answers" ADD "score" real`);
    await queryRunner.query(
      `ALTER TABLE "formation_answers" ADD "details" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_answers" DROP COLUMN "details"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_answers" DROP COLUMN "score"`,
    );
  }
}
