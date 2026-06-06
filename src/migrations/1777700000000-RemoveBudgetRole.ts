import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Retire le role `budget` de la colonne `roles` des utilisateurs.
 *
 * La colonne `users.roles` est declaree `@Column({ type: 'simple-array' })`
 * cote TypeORM : elle est stockee en Postgres comme une chaine `text` au
 * format CSV (ex. `weather,sebastian,budget`). On ne peut donc PAS utiliser
 * `array_remove` directement sur la colonne (elle n'est pas de type array
 * natif Postgres).
 *
 * Strategie idempotente :
 *   1. `string_to_array(roles, ',')` decoupe la CSV en array natif ;
 *   2. `array_remove(..., 'budget')` retire toutes les occurrences ;
 *   3. `array_to_string(..., ',')` recompose la CSV.
 *
 * On ne met a jour que les lignes contenant reellement `budget` pour eviter
 * des ecritures inutiles. Le `regexp` cible le token `budget` delimite par
 * des virgules ou les bornes de chaine, afin de ne pas matcher une sous-chaine
 * (aucun autre role ne contient « budget », mais la robustesse est gratuite).
 *
 * `down()` : no-op assume (le role budget est retire definitivement, sa
 * reattribution n'a aucun sens applicatif puisque le module a ete supprime).
 */
export class RemoveBudgetRole1777700000000 implements MigrationInterface {
  name = 'RemoveBudgetRole1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users"
       SET "roles" = array_to_string(
         array_remove(string_to_array("roles", ','), 'budget'),
         ','
       )
       WHERE "roles" ~ '(^|,)budget($|,)';`,
    );
  }

  /**
   * No-op : retrait definitif assume, le module budget n'existe plus.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionnellement vide : reattribuer le role budget n'a plus de sens.
  }
}
