import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cree la table budget_member_contributions qui persiste la contribution
 * mensuelle (salaire) declaree par chaque membre d'un groupe budget.
 *
 * Contraintes :
 *  - unicite (group_id, user_id, month, year) pour eviter les doublons
 *  - month entre 1 et 12, year entre 2000 et 2100
 *  - monthly_salary >= 0
 *  - cascade ON DELETE depuis budget_groups et users
 *  - index supplementaire (group_id, year, month) pour la lecture mensuelle
 */
export class CreateBudgetMemberContributions1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_member_contributions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" UUID NOT NULL REFERENCES "budget_groups"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "month" SMALLINT NOT NULL CHECK ("month" BETWEEN 1 AND 12),
        "year" SMALLINT NOT NULL CHECK ("year" BETWEEN 2000 AND 2100),
        "monthly_salary" NUMERIC(10,2) NOT NULL CHECK ("monthly_salary" >= 0),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_contrib_unique" UNIQUE ("group_id", "user_id", "month", "year")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_contrib_group_period"
        ON "budget_member_contributions" ("group_id", "year", "month")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_member_contributions"`,
    );
  }
}
