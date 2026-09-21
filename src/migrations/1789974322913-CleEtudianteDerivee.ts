import { MigrationInterface, QueryRunner } from 'typeorm';

const COLONNES = [
  ['formation_participants', 'student_key'],
  ['formation_mastery', 'student_key'],
] as const;

export class CleEtudianteDerivee1789974322913 implements MigrationInterface {
  name = 'CleEtudianteDerivee1789974322913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, colonne] of COLONNES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${colonne}" TYPE character varying(64) USING "${colonne}"::text`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, colonne] of COLONNES) {
      await queryRunner.query(
        `DELETE FROM "${table}" WHERE "${colonne}" !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${colonne}" TYPE uuid USING "${colonne}"::uuid`,
      );
    }
  }
}
