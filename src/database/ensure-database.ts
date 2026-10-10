import { Client, ClientConfig } from 'pg';
import { logBootstrapStep } from '../runtime/log-bootstrap-step';
import type { ConnexionPostgres } from './connexion-postgres';

function accesAdministrateur({
  url,
  host,
  port,
  username,
  password,
  ssl,
  baseAdmin,
}: ConnexionPostgres): ClientConfig | null {
  if (url !== undefined) {
    const adminUrl = new URL(url);
    adminUrl.pathname = `/${baseAdmin}`;
    return { connectionString: adminUrl.toString(), ssl };
  }
  if (!host || !username) return null;
  return { host, port, user: username, password, ssl };
}

export async function garantirLaBaseCible(
  connexion: ConnexionPostgres,
): Promise<void> {
  const { database } = connexion;
  if (!database) return;
  const acces = accesAdministrateur(connexion);
  if (acces === null) return;

  logBootstrapStep(`ensuring database ${database}`);
  const client = new Client({ ...acces, database: 'postgres' });
  await client.connect();

  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}
