import { Client, ClientConfig } from 'pg';

export interface EnsureDatabaseOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  ssl?: ClientConfig['ssl'];
  adminDatabase?: string;
}

export async function ensureDatabaseExists({
  connectionString,
  host,
  port,
  username,
  password,
  database,
  ssl,
  adminDatabase = 'postgres',
}: EnsureDatabaseOptions): Promise<void> {
  if (!database) {
    return;
  }

  const sanitizedDatabase = database.replace(/"/g, '""');

  const baseConfig: ClientConfig =
    connectionString !== undefined
      ? {
          connectionString,
          ssl,
        }
      : {
          host,
          port,
          user: username,
          password,
          ssl,
        };

  // Connect to admin database to manage other databases
  const adminConfig: ClientConfig = {
    ...baseConfig,
    database: adminDatabase,
  };

  const client = new Client(adminConfig);
  await client.connect();

  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${sanitizedDatabase}"`);
    }
  } finally {
    await client.end();
  }
}
