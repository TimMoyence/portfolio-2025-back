import { readdirSync } from 'fs';
import { join } from 'path';
import {
  DataSource,
  type DataSourceOptions,
  type MigrationInterface,
} from 'typeorm';
import type { SourceDEnv } from '../../src/config/env-readers.util';
import { resoudreConnexionPostgres } from '../../src/database/connexion-postgres';
import { RACINE } from './racine';

type PostgresEntities = Extract<
  DataSourceOptions,
  { type: 'postgres' }
>['entities'];

const DELAI_MIGRATIONS_MS = 120_000;
const DOSSIER_DES_MIGRATIONS = join(RACINE, 'src/migrations');

export const TOUTES_LES_ENTITES = join(RACINE, 'src/**/*.entity.ts');
export const TOUTES_LES_MIGRATIONS = join(
  DOSSIER_DES_MIGRATIONS,
  '!(*.spec).ts',
);

const MIGRATION_HORODATEE = /^(\d+)-.+(?<!\.spec)\.ts$/;

function horodatageDe(fichierDeMigration: string): number {
  const horodatage = MIGRATION_HORODATEE.exec(`${fichierDeMigration}.ts`);
  if (!horodatage) {
    throw new Error(`Migration « ${fichierDeMigration} » sans horodatage.`);
  }
  return Number(horodatage[1]);
}

export function migrationsAnterieuresA(fichierDeMigration: string): string[] {
  const limite = horodatageDe(fichierDeMigration);
  return readdirSync(DOSSIER_DES_MIGRATIONS)
    .filter((fichier) => {
      const horodatage = MIGRATION_HORODATEE.exec(fichier);
      return horodatage !== null && Number(horodatage[1]) < limite;
    })
    .map((fichier) => join(DOSSIER_DES_MIGRATIONS, fichier));
}

export const describeDb =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

const BASE_DE_TEST_PAR_DEFAUT = 'portfolio_2025_ci';
const NOM_DE_BASE_JETABLE = /_(ci|test)$/;

function baseJetable(nom: string): string {
  if (!NOM_DE_BASE_JETABLE.test(nom)) {
    throw new Error(
      `Base « ${nom} » refusée : chaque suite d'intégration vide son schéma, seule une base suffixée _ci ou _test est admise.`,
    );
  }
  return nom;
}

export function buildDbIntegrationOptions(
  entities: PostgresEntities,
  source: SourceDEnv = process.env,
): DataSourceOptions {
  const { host, port, username, password, database, ssl } =
    resoudreConnexionPostgres({ ...source, DATABASE_URL: undefined });

  return {
    type: 'postgres',
    host: host ?? '127.0.0.1',
    port: port ?? 5432,
    username: username ?? 'postgres',
    password: password ?? 'postgres',
    database: baseJetable(database ?? BASE_DE_TEST_PAR_DEFAUT),
    entities,
    synchronize: true,
    dropSchema: true,
    logging: false,
    ...(ssl ? { ssl } : {}),
  };
}

export async function initDbIntegrationDataSource(
  entities: PostgresEntities,
): Promise<DataSource> {
  const dataSource = new DataSource(buildDbIntegrationOptions(entities));
  await dataSource.initialize();
  return dataSource;
}

const FONCTIONS_HORS_DU_DROP_SCHEMA = [
  '"reject_formation_course_content_change"()',
];

export async function initBaseMigree(
  entities: PostgresEntities,
  migrations: string[],
  fuseauDeLaSession?: string,
): Promise<DataSource> {
  const dataSource = new DataSource({
    ...buildDbIntegrationOptions(entities),
    synchronize: false,
    migrations,
    ...(fuseauDeLaSession === undefined
      ? {}
      : { extra: { options: `-c TimeZone=${fuseauDeLaSession}` } }),
  });
  await initialiserEtMigrer(dataSource);
  return dataSource;
}

export function baseMigreeDeLaSuite(
  entities: PostgresEntities,
  migrations: string[],
  fuseauDeLaSession?: string,
): () => DataSource {
  let dataSource: DataSource | undefined;

  beforeAll(async () => {
    dataSource = await initBaseMigree(entities, migrations, fuseauDeLaSession);
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  return () => {
    if (!dataSource) throw new Error('Base migree de test non initialisee');
    return dataSource;
  };
}

export function jouerLaMigration(
  dataSource: DataSource,
  migration: MigrationInterface,
  sens: 'up' | 'down',
): Promise<void> {
  return dataSource.transaction((manager) =>
    migration[sens](manager.queryRunner!),
  );
}

export async function tablesPresentes(
  dataSource: DataSource,
  tables: readonly string[],
): Promise<string[]> {
  const lignes: { table_name: string }[] = await dataSource.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)
     ORDER BY table_name`,
    [tables],
  );
  return lignes.map(({ table_name }) => table_name);
}

export async function typesEnumeresPresents(
  dataSource: DataSource,
  types: readonly string[],
): Promise<string[]> {
  const lignes: { typname: string }[] = await dataSource.query(
    `SELECT t.typname FROM pg_type t
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typname = ANY($1)
     ORDER BY t.typname`,
    [types],
  );
  return lignes.map(({ typname }) => typname);
}

export async function inscrireUtilisateur(
  dataSource: DataSource,
  email: string,
  roles = '',
): Promise<string> {
  const [{ id }]: { id: string }[] = await dataSource.query(
    `INSERT INTO "users" ("email", "first_name", "last_name", "roles")
     VALUES ($1, 'Test', 'Integration', $2) RETURNING "id"`,
    [email, roles],
  );
  return id;
}

export async function initialiserEtMigrer(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.initialize();
  for (const fonction of FONCTIONS_HORS_DU_DROP_SCHEMA) {
    await dataSource.query(`DROP FUNCTION IF EXISTS ${fonction} CASCADE`);
  }
  await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await dataSource.runMigrations({ transaction: 'all' });
}

export async function attendreSchemaAligneSurLesEntites(
  dataSource: DataSource,
): Promise<void> {
  const derive = await dataSource.driver.createSchemaBuilder().log();

  expect(derive.upQueries.map((requete) => requete.query)).toEqual([]);
}

export async function destroyDbIntegrationDataSource(
  dataSource: DataSource | undefined,
): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
