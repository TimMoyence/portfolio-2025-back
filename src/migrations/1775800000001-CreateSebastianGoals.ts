import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSebastianGoals1775800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sebastian_goals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category" varchar(20) NOT NULL CHECK ("category" IN ('alcohol', 'coffee')),
        "target_quantity" decimal(10, 2) NOT NULL CHECK ("target_quantity" > 0),
        "period" varchar(20) NOT NULL CHECK ("period" IN ('daily', 'weekly', 'monthly')),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "idx_sebastian_goals_user" ON "sebastian_goals" ("user_id");
      CREATE INDEX "idx_sebastian_goals_active" ON "sebastian_goals" ("user_id", "is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sebastian_goals";`);
  }
}
