import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens1775300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp NOT NULL,
        "used_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_user_id"
      ON "password_reset_tokens" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_expires_at"
      ON "password_reset_tokens" ("expires_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_password_reset_tokens_used_at_null"
      ON "password_reset_tokens" ("used_at")
      WHERE "used_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_tokens_used_at_null"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens";`);
  }
}
