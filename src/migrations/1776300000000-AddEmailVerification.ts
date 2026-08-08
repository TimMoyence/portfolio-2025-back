import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1776300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      UPDATE "users" SET "email_verified" = true;
    `);

    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_verification_tokens_user_id"
      ON "email_verification_tokens" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_verification_tokens_expires_at"
      ON "email_verification_tokens" ("expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_email_verification_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_email_verification_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "email_verification_tokens";`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_verified";`,
    );
  }
}
