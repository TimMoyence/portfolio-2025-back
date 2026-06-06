import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retrait definitif du module Budget (CommonBudget) du backend.
 *
 * Supprime les 9 tables budget dans l'ordre inverse des dependances de cles
 * etrangeres pour eviter toute violation de contrainte FK :
 *   1. budget_member_contributions  (FK -> budget_groups, users)
 *   2. budget_goals                 (FK -> budget_groups, budget_categories, users)
 *   3. budget_invitations           (pas de FK declaree, valeurs uuid libres)
 *   4. budget_share_attempts        (pas de FK declaree, valeurs uuid libres)
 *   5. budget_entries               (FK -> budget_groups, budget_categories)
 *   6. budget_recurring_entries     (FK -> budget_groups, budget_categories)
 *   7. budget_categories            (FK -> budget_groups + self-ref replaces_default_id)
 *   8. budget_group_members         (FK -> budget_groups, users)
 *   9. budget_groups                (FK -> users) — table racine
 *
 * `DROP TABLE IF EXISTS` garantit l'idempotence ; `CASCADE` neutralise tout
 * index ou contrainte residuel (notamment la self-reference de
 * budget_categories).
 *
 * `down()` : no-op assume. Le retrait du module est definitif et la
 * recreation des tables est hors scope (les entites TypeORM correspondantes
 * ont ete supprimees, aucune source de verite ne permet de regenerer le
 * schema sans regression).
 */
export class DropBudgetTables1777600000000 implements MigrationInterface {
  name = 'DropBudgetTables1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_member_contributions" CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_goals" CASCADE;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_invitations" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_share_attempts" CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_entries" CASCADE;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_recurring_entries" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_categories" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "budget_group_members" CASCADE;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_groups" CASCADE;`);
  }

  /**
   * No-op : retrait definitif assume, recreation hors scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionnellement vide : le module budget est retire definitivement.
  }
}
