import { join } from 'path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { resoudreConnexionPostgres } from '../../src/database/connexion-postgres';

type PostgresEntities = Extract<
  DataSourceOptions,
  { type: 'postgres' }
>['entities'];

const DELAI_MIGRATIONS_MS = 120_000;
const DOSSIER_DES_MIGRATIONS = join(__dirname, '../../src/migrations');

export const TOUTES_LES_ENTITES = join(__dirname, '../../src/**/*.entity.ts');
export const TOUTES_LES_MIGRATIONS = join(
  DOSSIER_DES_MIGRATIONS,
  '!(*.spec).ts',
);

export function migrationsAnterieuresA(fichierDeMigration: string): string {
  return join(DOSSIER_DES_MIGRATIONS, `!(*.spec|${fichierDeMigration}).ts`);
}

export const describeDb =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

export function buildDbIntegrationOptions(
  entities: PostgresEntities,
): DataSourceOptions {
  const { host, port, username, password, database, ssl } =
    resoudreConnexionPostgres();

  return {
    type: 'postgres',
    host: host ?? '127.0.0.1',
    port: port ?? 5432,
    username: username ?? 'postgres',
    password: password ?? 'postgres',
    database: database ?? 'portfolio_2025_ci',
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
): Promise<DataSource> {
  const dataSource = new DataSource({
    ...buildDbIntegrationOptions(entities),
    synchronize: false,
    migrations,
  });
  await initialiserEtMigrer(dataSource);
  return dataSource;
}

export function baseMigreeDeLaSuite(
  entities: PostgresEntities,
  migrations: string[],
): () => DataSource {
  let dataSource: DataSource | undefined;

  beforeAll(async () => {
    dataSource = await initBaseMigree(entities, migrations);
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  return () => {
    if (!dataSource) throw new Error('Base migree de test non initialisee');
    return dataSource;
  };
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
