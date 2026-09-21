import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFormationSessionPilotage1789861524871 implements MigrationInterface {
  name = 'AddFormationSessionPilotage1789861524871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD "pilotage_ecrans" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" ADD "revision" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP COLUMN "revision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "formation_sessions" DROP COLUMN "pilotage_ecrans"`,
    );
  }
}
