import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBudgetGroups1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "budget_group_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" uuid NOT NULL REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "joined_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("group_id", "user_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "budget_group_members";`);
    await queryRunner.query(`DROP TABLE "budget_groups";`);
  }
}
