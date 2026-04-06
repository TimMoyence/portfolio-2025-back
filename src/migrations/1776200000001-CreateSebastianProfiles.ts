import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSebastianProfiles1776200000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sebastian_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "weight_kg" decimal(5, 1) NOT NULL DEFAULT 70.0,
        "widmark_r" decimal(3, 2) NOT NULL DEFAULT 0.68,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sebastian_profiles";`);
  }
}
