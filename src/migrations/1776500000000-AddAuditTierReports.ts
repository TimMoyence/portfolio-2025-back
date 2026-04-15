import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditTierReports1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_requests"
        ADD COLUMN "client_report" jsonb NULL,
        ADD COLUMN "expert_report" jsonb NULL,
        ADD COLUMN "engine_coverage" jsonb NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_requests"
        DROP COLUMN "engine_coverage",
        DROP COLUMN "expert_report",
        DROP COLUMN "client_report";
    `);
  }
}
