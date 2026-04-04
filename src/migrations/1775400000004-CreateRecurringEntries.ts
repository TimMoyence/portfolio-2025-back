import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecurringEntries1775400000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_recurring_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" uuid REFERENCES "budget_categories"("id") ON DELETE SET NULL,
        "description" varchar(255) NOT NULL,
        "amount" decimal(10, 2) NOT NULL,
        "type" varchar(10) NOT NULL CHECK ("type" IN ('FIXED', 'VARIABLE')),
        "frequency" varchar(10) NOT NULL CHECK ("frequency" IN ('MONTHLY', 'WEEKLY', 'BIWEEKLY')),
        "day_of_month" integer CHECK ("day_of_month" >= 1 AND "day_of_month" <= 31),
        "day_of_week" integer CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6),
        "start_date" date NOT NULL,
        "end_date" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX "idx_recurring_entries_group_active" ON "budget_recurring_entries" ("group_id", "is_active");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "budget_recurring_entries";');
  }
}
