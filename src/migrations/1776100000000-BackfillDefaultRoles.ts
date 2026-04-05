import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute les roles par defaut (budget,weather,sebastian) aux utilisateurs
 * inscrits par email (self-registration) qui ont un champ roles vide.
 */
export class BackfillDefaultRoles1776100000000 implements MigrationInterface {
  name = 'BackfillDefaultRoles1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users"
       SET "roles" = 'budget,weather,sebastian'
       WHERE "roles" = ''
         AND "updated_or_created_by" = 'self-registration'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users"
       SET "roles" = ''
       WHERE "roles" = 'budget,weather,sebastian'
         AND "updated_or_created_by" = 'self-registration'`,
    );
  }
}
