import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cree la table budget_goals qui persiste les objectifs declares par les
 * membres d'un groupe budget : epargne, plafond global, plafond par categorie.
 *
 * Contraintes :
 *  - kind dans (SAVINGS, SPENDING_LIMIT, CATEGORY_LIMIT)
 *  - target_amount >= 0
 *  - chk_goal_category : CATEGORY_LIMIT exige category_id NOT NULL
 *  - cascade ON DELETE depuis budget_groups, SET NULL sur budget_categories
 *  - index supplementaire (group_id, is_active) pour la lecture des objectifs actifs
 */
export class CreateBudgetGoals1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_goals" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" UUID NOT NULL REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "created_by_user_id" UUID NOT NULL REFERENCES "users"("id"),
        "name" VARCHAR(120) NOT NULL,
        "kind" VARCHAR(20) NOT NULL CHECK ("kind" IN ('SAVINGS','SPENDING_LIMIT','CATEGORY_LIMIT')),
        "target_amount" NUMERIC(12,2) NOT NULL CHECK ("target_amount" >= 0),
        "category_id" UUID REFERENCES "budget_categories"("id") ON DELETE SET NULL,
        "deadline" TIMESTAMPTZ NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "chk_goal_category" CHECK (
          ("kind" = 'CATEGORY_LIMIT' AND "category_id" IS NOT NULL)
          OR ("kind" <> 'CATEGORY_LIMIT')
        )
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_goals_group_active"
        ON "budget_goals" ("group_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_goals"`);
  }
}
