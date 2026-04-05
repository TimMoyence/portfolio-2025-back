import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTelegramLinks1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "telegram_links" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "telegram_user_id" bigint NOT NULL UNIQUE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "linked_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "idx_telegram_links_user_id" ON "telegram_links" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "telegram_links";`);
  }
}
