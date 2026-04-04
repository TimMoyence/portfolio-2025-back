import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSebastianEntries1775800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sebastian_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category" varchar(20) NOT NULL CHECK ("category" IN ('alcohol', 'coffee')),
        "quantity" decimal(10, 2) NOT NULL CHECK ("quantity" > 0),
        "unit" varchar(20) NOT NULL CHECK ("unit" IN ('standard_drink', 'cup')),
        "date" date NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "idx_sebastian_entries_user_date" ON "sebastian_entries" ("user_id", "date");
      CREATE INDEX "idx_sebastian_entries_category" ON "sebastian_entries" ("category");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sebastian_entries";`);
  }
}
