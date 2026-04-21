import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsletterSubscribers1776700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "first_name" varchar(50),
        "locale" varchar(10) NOT NULL,
        "source_formation_slug" varchar(100) NOT NULL,
        "status" varchar(20) NOT NULL,
        "confirm_token" uuid NOT NULL,
        "unsubscribe_token" uuid NOT NULL,
        "terms_version" varchar(50) NOT NULL,
        "terms_accepted_at" timestamptz NOT NULL,
        "confirmed_at" timestamptz,
        "unsubscribed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_newsletter_email_source" UNIQUE ("email", "source_formation_slug")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_newsletter_confirm_token"
        ON "newsletter_subscribers" ("confirm_token");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_newsletter_unsubscribe_token"
        ON "newsletter_subscribers" ("unsubscribe_token");
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_newsletter_status"
        ON "newsletter_subscribers" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_newsletter_status";`);
    await queryRunner.query(`DROP INDEX "idx_newsletter_unsubscribe_token";`);
    await queryRunner.query(`DROP INDEX "idx_newsletter_confirm_token";`);
    await queryRunner.query(`DROP TABLE "newsletter_subscribers";`);
  }
}
