import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetCategories1775400000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" uuid REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "name" varchar(100) NOT NULL,
        "color" varchar(7) DEFAULT '#6B7280',
        "icon" varchar(50) DEFAULT 'tag',
        "budget_type" varchar(10) NOT NULL DEFAULT 'VARIABLE' CHECK ("budget_type" IN ('FIXED', 'VARIABLE')),
        "budget_limit" decimal(10, 2) DEFAULT 0,
        "display_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "budget_categories";`);
  }
}
