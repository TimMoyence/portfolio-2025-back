import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeadMagnetRequests1776300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lead_magnet_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" varchar(50) NOT NULL,
        "email" varchar(255) NOT NULL,
        "formation_slug" varchar(100) NOT NULL,
        "terms_version" varchar(50) NOT NULL,
        "terms_locale" varchar(10) NOT NULL,
        "terms_accepted_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_lead_magnet_requests_email_slug"
        ON "lead_magnet_requests"("email", "formation_slug");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_lead_magnet_requests_email_slug";`,
    );
    await queryRunner.query(`DROP TABLE "lead_magnet_requests";`);
  }
}
