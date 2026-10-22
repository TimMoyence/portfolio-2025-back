import { MigrationInterface, QueryRunner } from 'typeorm';

export class BorneLesSuccesseursDUnJeton1792671102848 implements MigrationInterface {
  name = 'BorneLesSuccesseursDUnJeton1792671102848';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "successeurs_emis" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "successeurs_emis"`,
    );
  }
}
