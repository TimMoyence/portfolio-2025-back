import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfirmTokenExpiration1776800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscribers"
      ADD COLUMN "confirm_token_expires_at" timestamptz;
    `);
    await queryRunner.query(`
      ALTER TABLE "newsletter_subscribers"
      ADD COLUMN "last_confirmation_sent_at" timestamptz;
    `);

    // Backfill semantique (audit-log friendly) :
    //  - pending : NOW() + 7j (benefice du doute, le token reste consomable)
    //  - autres  : terms_accepted_at + 7j (ce que le TTL aurait ete a
    //    l'origine). On evite "expired at migration time" qui brouille
    //    tout audit futur des tokens historiques.
    await queryRunner.query(`
      UPDATE "newsletter_subscribers"
      SET "confirm_token_expires_at" = CASE
        WHEN "status" = 'pending' THEN NOW() + INTERVAL '7 days'
        ELSE "terms_accepted_at" + INTERVAL '7 days'
      END
      WHERE "confirm_token_expires_at" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "newsletter_subscribers"
      ALTER COLUMN "confirm_token_expires_at" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_newsletter_confirm_token_expires_at"
        ON "newsletter_subscribers" ("confirm_token_expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_newsletter_confirm_token_expires_at";`,
    );
    await queryRunner.query(
      `ALTER TABLE "newsletter_subscribers" DROP COLUMN "last_confirmation_sent_at";`,
    );
    await queryRunner.query(
      `ALTER TABLE "newsletter_subscribers" DROP COLUMN "confirm_token_expires_at";`,
    );
  }
}
