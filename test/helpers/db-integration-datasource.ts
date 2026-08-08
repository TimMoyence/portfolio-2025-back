import { DataSource, type DataSourceOptions } from 'typeorm';

type PostgresEntities = Extract<
  DataSourceOptions,
  { type: 'postgres' }
>['entities'];

export const describeDb =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

function parsePort(raw: string | undefined): number {
  if (!raw) return 5432;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 5432;
}

export function buildDbIntegrationOptions(
  entities: PostgresEntities,
): DataSourceOptions {
  const sslEnabled =
    process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true';

  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? process.env.DATABASE_HOST ?? '127.0.0.1',
    port: parsePort(process.env.DB_PORT ?? process.env.DATABASE_PORT),
    username:
      process.env.DB_USERNAME ??
      process.env.DB_USER ??
      process.env.DATABASE_USER ??
      'postgres',
    password:
      process.env.DB_PASSWORD ??
      process.env.DB_PASS ??
      process.env.DATABASE_PASSWORD ??
      'postgres',
    database:
      process.env.DB_NAME ?? process.env.DATABASE_NAME ?? 'portfolio_2025_ci',
    entities,
    synchronize: true,
    dropSchema: true,
    logging: false,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

export async function initDbIntegrationDataSource(
  entities: PostgresEntities,
): Promise<DataSource> {
  const dataSource = new DataSource(buildDbIntegrationOptions(entities));
  await dataSource.initialize();
  return dataSource;
}

export async function destroyDbIntegrationDataSource(
  dataSource: DataSource | undefined,
): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
