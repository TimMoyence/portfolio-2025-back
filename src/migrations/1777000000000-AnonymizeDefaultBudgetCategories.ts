import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renomme les categories par defaut (group_id = NULL) pour retirer
 * les references personnelles ("Tim & Maria", "Luna", "Contribution").
 *
 * Contexte : la migration initiale SeedDefaultBudgetCategories1775400000003
 * inserait des categories partagees a tous les utilisateurs (group_id NULL)
 * avec des libelles non generiques. Tout nouveau compte budget voyait ces
 * libelles, fuitant des informations privees du proprietaire de l'instance.
 */
export class AnonymizeDefaultBudgetCategories1777000000000 implements MigrationInterface {
  private static readonly RENAMES: ReadonlyArray<readonly [string, string]> = [
    ['Forfait telephone Tim & Maria', 'Telephone'],
    ['Netflix & Amazon & Ororo', 'Abonnements streaming'],
    ['Luna', 'Animaux'],
    ['Contribution', 'Apports / Virements entrants'],
  ];

  private static readonly REVERTS: ReadonlyArray<readonly [string, string]> = [
    ['Telephone', 'Forfait telephone Tim & Maria'],
    ['Abonnements streaming', 'Netflix & Amazon & Ororo'],
    ['Animaux', 'Luna'],
    ['Apports / Virements entrants', 'Contribution'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [
      from,
      to,
    ] of AnonymizeDefaultBudgetCategories1777000000000.RENAMES) {
      await queryRunner.query(
        `UPDATE "budget_categories"
            SET "name" = $1
          WHERE "group_id" IS NULL
            AND "name" = $2`,
        [to, from],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [
      from,
      to,
    ] of AnonymizeDefaultBudgetCategories1777000000000.REVERTS) {
      await queryRunner.query(
        `UPDATE "budget_categories"
            SET "name" = $1
          WHERE "group_id" IS NULL
            AND "name" = $2`,
        [to, from],
      );
    }
  }
}
