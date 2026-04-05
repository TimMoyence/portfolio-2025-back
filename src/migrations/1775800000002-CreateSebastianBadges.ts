import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSebastianBadges1775800000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sebastian_badges" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "badge_key" varchar(50) NOT NULL,
        "category" varchar(20) NOT NULL CHECK ("category" IN ('alcohol', 'coffee', 'global')),
        "unlocked_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "uq_sebastian_badges_user_key" UNIQUE ("user_id", "badge_key")
      );

      CREATE INDEX "idx_sebastian_badges_user" ON "sebastian_badges" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sebastian_badges";`);
  }
}
