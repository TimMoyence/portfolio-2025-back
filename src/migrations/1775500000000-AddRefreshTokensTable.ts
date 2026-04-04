import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensTable1775500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" varchar(64) NOT NULL UNIQUE,
        "expires_at" timestamp NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id"
      ON "refresh_tokens" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_expires_at"
      ON "refresh_tokens" ("expires_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_not_revoked"
      ON "refresh_tokens" ("revoked")
      WHERE "revoked" = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_not_revoked"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens";`);
  }
}
