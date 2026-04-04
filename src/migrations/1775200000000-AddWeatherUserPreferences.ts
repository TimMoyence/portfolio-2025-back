import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeatherUserPreferences1775200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "weather_user_preferences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "level" varchar(20) NOT NULL DEFAULT 'discovery',
        "favorite_cities" jsonb NOT NULL DEFAULT '[]',
        "days_used" integer NOT NULL DEFAULT 0,
        "last_used_at" timestamp,
        "tooltips_seen" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "weather_user_preferences";`);
  }
}
