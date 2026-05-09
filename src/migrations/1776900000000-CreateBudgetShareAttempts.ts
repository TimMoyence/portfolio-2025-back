import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cree la table `budget_share_attempts` qui materialise le cooldown
 * applicatif anti mail-bombing pour le partage de budget (CRIT-2 audit
 * 2026-05-09). Index compose sur (group_id, target_email, sent_at) pour
 * la recherche `findRecent` ; pas de FK pour pouvoir tracer une
 * tentative meme apres suppression du groupe.
 */
export class CreateBudgetShareAttempts1776900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_share_attempts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "target_email" varchar(254) NOT NULL,
        "sent_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_budget_share_attempts_lookup"
        ON "budget_share_attempts" ("group_id", "target_email", "sent_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_budget_share_attempts_lookup";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_share_attempts";`);
  }
}
