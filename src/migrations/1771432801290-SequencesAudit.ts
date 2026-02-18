import { MigrationInterface, QueryRunner } from 'typeorm';

export class SequencesAudit1771432801290 implements MigrationInterface {
  name = 'SequencesAudit1771432801290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "redirectChain" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "keyChecks" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "quickWins" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "pillarScores" SET DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "pillarScores" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "quickWins" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "keyChecks" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ALTER COLUMN "redirectChain" SET DEFAULT '[]'`,
    );
  }
}
