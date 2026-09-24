import { join } from 'path';
import type { DataSource } from 'typeorm';
import { RetireLAtelier1790800000000 } from '../src/migrations/1790800000000-RetireLAtelier';
import {
  describeDb,
  destroyDbIntegrationDataSource,
  initBaseMigree,
} from './helpers/db-integration-datasource';

const MIGRATIONS_ANTERIEURES = join(
  __dirname,
  '../src/migrations/!(*.spec|1790800000000-RetireLAtelier).ts',
);
const TABLES_DE_L_ATELIER = [
  'sebastian_badges',
  'sebastian_entries',
  'sebastian_goals',
  'sebastian_profiles',
  'telegram_links',
  'weather_user_preferences',
];
const DELAI_MIGRATIONS_MS = 120_000;

describeDb('Retrait de l atelier sur une base migree', () => {
  let dataSource: DataSource;

  const tablesPresentes = async (): Promise<string[]> => {
    const lignes: { table_name: string }[] = await dataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)
       ORDER BY table_name`,
      [TABLES_DE_L_ATELIER],
    );
    return lignes.map(({ table_name }) => table_name);
  };

  const inscrire = async (email: string, roles: string): Promise<void> => {
    await dataSource.query(
      `INSERT INTO "users" ("email", "first_name", "last_name", "roles")
       VALUES ($1, 'Test', 'Atelier', $2)`,
      [email, roles],
    );
  };

  const rolesDe = async (email: string): Promise<string> => {
    const [ligne]: { roles: string }[] = await dataSource.query(
      `SELECT "roles" FROM "users" WHERE "email" = $1`,
      [email],
    );
    return ligne.roles;
  };

  beforeAll(async () => {
    dataSource = await initBaseMigree([], [MIGRATIONS_ANTERIEURES]);
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  it('supprime les tables meteo, sebastian et telegram et retire leurs roles', async () => {
    expect(await tablesPresentes()).toEqual(TABLES_DE_L_ATELIER);
    await inscrire('mixte@example.com', 'weather,sebastian,teacher');
    await inscrire('atelier@example.com', 'sebastian,weather');
    await inscrire('admin@example.com', 'admin');
    await inscrire('homonyme@example.com', 'weathers,teacher');

    await dataSource.transaction((manager) =>
      new RetireLAtelier1790800000000().up(manager.queryRunner!),
    );

    expect(await tablesPresentes()).toEqual([]);
    expect(await rolesDe('mixte@example.com')).toBe('teacher');
    expect(await rolesDe('atelier@example.com')).toBe('');
    expect(await rolesDe('admin@example.com')).toBe('admin');
    expect(await rolesDe('homonyme@example.com')).toBe('weathers,teacher');
  });

  it('refuse de recreer l atelier au retour arriere', async () => {
    await expect(new RetireLAtelier1790800000000().down()).rejects.toThrow(
      /definitif/,
    );
    expect(await tablesPresentes()).toEqual([]);
  });
});
