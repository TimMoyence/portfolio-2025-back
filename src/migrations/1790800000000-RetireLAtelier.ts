import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES_DE_L_ATELIER = [
  'sebastian_badges',
  'sebastian_entries',
  'sebastian_goals',
  'sebastian_profiles',
  'telegram_links',
  'weather_user_preferences',
];

export class RetireLAtelier1790800000000 implements MigrationInterface {
  name = 'RetireLAtelier1790800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES_DE_L_ATELIER) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
    await queryRunner.query(`
      UPDATE "users"
      SET "roles" = array_to_string(
        array_remove(array_remove(string_to_array("roles", ','), 'weather'), 'sebastian'),
        ','
      )
      WHERE "roles" ~ '(^|,)(weather|sebastian)(,|$)'
    `);
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'Retrait definitif de l atelier : les modules meteo et sebastian et leurs tables ne sont plus servis.',
      ),
    );
  }
}
