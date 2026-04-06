import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDrinkTypeAndBacColumns1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sebastian_entries" ADD COLUMN "drink_type" varchar(20);
      ALTER TABLE "sebastian_entries" ADD COLUMN "alcohol_degree" decimal(5, 2);
      ALTER TABLE "sebastian_entries" ADD COLUMN "volume_cl" decimal(6, 1);
      ALTER TABLE "sebastian_entries" ADD COLUMN "consumed_at" timestamp;
      CREATE INDEX "idx_sebastian_entries_consumed_at" ON "sebastian_entries" ("user_id", "consumed_at") WHERE "consumed_at" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "idx_sebastian_entries_consumed_at";
      ALTER TABLE "sebastian_entries" DROP COLUMN "consumed_at";
      ALTER TABLE "sebastian_entries" DROP COLUMN "volume_cl";
      ALTER TABLE "sebastian_entries" DROP COLUMN "alcohol_degree";
      ALTER TABLE "sebastian_entries" DROP COLUMN "drink_type";
    `);
  }
}
