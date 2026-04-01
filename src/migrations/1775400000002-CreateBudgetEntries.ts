import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetEntries1775400000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "budget_categories"("id") ON DELETE SET NULL,
        "date" date NOT NULL,
        "description" varchar(255) NOT NULL,
        "amount" decimal(10, 2) NOT NULL,
        "type" varchar(10) NOT NULL DEFAULT 'VARIABLE' CHECK ("type" IN ('FIXED', 'VARIABLE')),
        "state" varchar(20) DEFAULT 'COMPLETED',
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "idx_budget_entries_group_date" ON "budget_entries" ("group_id", "date");
      CREATE INDEX "idx_budget_entries_category" ON "budget_entries" ("category_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "budget_entries";`);
  }
}
