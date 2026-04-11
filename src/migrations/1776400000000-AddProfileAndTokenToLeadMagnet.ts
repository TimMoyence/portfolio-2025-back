import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileAndTokenToLeadMagnet1776400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lead_magnet_requests"
        ADD COLUMN "access_token" uuid DEFAULT gen_random_uuid(),
        ADD COLUMN "profile" jsonb DEFAULT '{}';
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_lead_magnet_requests_access_token"
        ON "lead_magnet_requests"("access_token");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_lead_magnet_requests_access_token";`,
    );
    await queryRunner.query(`
      ALTER TABLE "lead_magnet_requests"
        DROP COLUMN "profile",
        DROP COLUMN "access_token";
    `);
  }
}
