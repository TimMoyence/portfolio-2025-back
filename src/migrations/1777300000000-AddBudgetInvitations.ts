import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cree la table `budget_invitations` qui materialise les invitations
 * magic-link pour rejoindre un groupe budget. Le token clair n'est
 * jamais persiste : seul son hash SHA-256 (token_hash) est stocke.
 *
 * Index :
 *  - uq_budget_invitations_token_hash : unique global sur token_hash
 *    (collision = invalidation immediate).
 *  - uq_budget_invitations_active : index unique PARTIEL sur
 *    (group_id, target_email) WHERE non consommee. Empeche d'avoir
 *    deux invitations actives concurrentes pour la meme paire ; les
 *    invitations consommees (acceptees ou revoquees) restent en base
 *    pour audit sans bloquer la re-emission.
 *  - idx_budget_invitations_group_pending : index PARTIEL sur
 *    (group_id) WHERE non consommee, pour la liste des invitations en
 *    attente cote owner.
 *
 * Pas de FK vers budget_groups / users : on conserve la ligne pour
 * audit meme apres suppression du groupe ou de l'inviteur.
 */
export class AddBudgetInvitations1777300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budget_invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" uuid NOT NULL,
        "inviter_user_id" uuid NOT NULL,
        "target_email" varchar(254) NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz NULL,
        "accepted_by_user_id" uuid NULL,
        "revoked_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_budget_invitations_token_hash" UNIQUE ("token_hash")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_budget_invitations_active"
        ON "budget_invitations" ("group_id", "target_email")
        WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_budget_invitations_group_pending"
        ON "budget_invitations" ("group_id")
        WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_budget_invitations_group_pending";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_budget_invitations_active";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_invitations";`);
  }
}
