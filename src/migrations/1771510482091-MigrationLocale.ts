import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationLocale1771510482091 implements MigrationInterface {
  name = 'MigrationLocale1771510482091';

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
    // await queryRunner.query(
    //   `ALTER TABLE "audit_requests" DROP COLUMN "locale"`,
    // );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ADD "locale" text NOT NULL DEFAULT 'fr'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_requests" DROP COLUMN "locale"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_requests" ADD "locale" character varying(3) NOT NULL DEFAULT 'fr'`,
    );
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
