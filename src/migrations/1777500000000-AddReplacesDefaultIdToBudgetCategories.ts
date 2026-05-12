import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la colonne `replaces_default_id` (nullable) a la table
 * `budget_categories`. Cette colonne pointe vers la ligne par defaut
 * (group_id IS NULL) dont la categorie courante est un clone per-group
 * (pattern copy-on-write transparent pour le client).
 *
 * Utilisee par `UpdateBudgetCategoryUseCase` (auto-clone lors d'une mise
 * a jour ciblant une default) et par `findByGroupId` (filtre des defauts
 * deja overrides dans le groupe).
 *
 * Contraintes :
 *  - FK self-reference vers `budget_categories(id)` avec
 *    `ON DELETE SET NULL` : si la default disparait, le clone reste
 *    autonome au lieu d'etre supprime en cascade.
 *  - Index unique partiel `(group_id, replaces_default_id)` empeche
 *    deux clones de la meme default dans le meme groupe.
 *  - Index simple sur `replaces_default_id` pour accelerer le subquery
 *    NOT IN de `findByGroupId`.
 */
export class AddReplacesDefaultIdToBudgetCategories1777500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_categories" ADD COLUMN IF NOT EXISTS "replaces_default_id" uuid NULL;`,
    );
    await queryRunner.query(`
      ALTER TABLE "budget_categories"
      ADD CONSTRAINT "fk_budget_categories_replaces_default"
      FOREIGN KEY ("replaces_default_id")
      REFERENCES "budget_categories" ("id")
      ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_budget_categories_group_replaces"
        ON "budget_categories" ("group_id", "replaces_default_id")
        WHERE "replaces_default_id" IS NOT NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_budget_categories_replaces_default_id"
        ON "budget_categories" ("replaces_default_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_budget_categories_replaces_default_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uniq_budget_categories_group_replaces";`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_categories" DROP CONSTRAINT IF EXISTS "fk_budget_categories_replaces_default";`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_categories" DROP COLUMN IF EXISTS "replaces_default_id";`,
    );
  }
}
