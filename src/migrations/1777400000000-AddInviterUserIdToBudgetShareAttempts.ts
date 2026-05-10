import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la colonne `inviter_user_id` (nullable) a la table
 * `budget_share_attempts` et l'index compose
 * `idx_budget_share_attempts_inviter_quota` pour le rate limiting
 * par inviteur (nombre d'invitations envoyees sur une fenetre
 * glissante via `countByInviterSince`).
 *
 * Nullable car les anciennes lignes (avant invitations magic-link)
 * n'ont pas d'inviteur identifie ; les nouvelles tentatives en
 * fournissent toujours un.
 */
export class AddInviterUserIdToBudgetShareAttempts1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_share_attempts" ADD COLUMN IF NOT EXISTS "inviter_user_id" uuid NULL;`,
    );
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_budget_share_attempts_inviter_quota"
        ON "budget_share_attempts" ("inviter_user_id", "sent_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_budget_share_attempts_inviter_quota";`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_share_attempts" DROP COLUMN IF EXISTS "inviter_user_id";`,
    );
  }
}
