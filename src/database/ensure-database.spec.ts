import { Client } from 'pg';
import { resoudreConnexionPostgres } from './connexion-postgres';
import { garantirLaBaseCible } from './ensure-database';

jest.mock('pg', () => ({ Client: jest.fn() }));

const ClientSimule = Client as unknown as jest.Mock;

function clientQuiTrouve(rowCount: number) {
  const client = {
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rowCount }),
    end: jest.fn().mockResolvedValue(undefined),
  };
  ClientSimule.mockImplementation(() => client);
  return client;
}

describe('garantirLaBaseCible', () => {
  beforeEach(() => ClientSimule.mockReset());

  it('passe par la base d administration de l URL et cree la base absente', async () => {
    const client = clientQuiTrouve(0);

    await garantirLaBaseCible(
      resoudreConnexionPostgres({
        DATABASE_URL: 'postgres://u:p@h:5432/cible',
        DB_ADMIN_DATABASE: 'admin',
      }),
    );

    expect(ClientSimule).toHaveBeenCalledWith({
      connectionString: 'postgres://u:p@h:5432/admin',
      ssl: undefined,
      database: 'postgres',
    });
    expect(client.query).toHaveBeenLastCalledWith('CREATE DATABASE "cible"');
    expect(client.end).toHaveBeenCalled();
  });

  it('se connecte par les identifiants sans URL et ne recree pas une base existante', async () => {
    const client = clientQuiTrouve(1);

    await garantirLaBaseCible(
      resoudreConnexionPostgres({
        DB_HOST: 'db',
        DB_PORT: '5433',
        POSTGRES_USER: 'u',
        POSTGRES_PASSWORD: 'p',
        POSTGRES_DB: 'cible',
      }),
    );

    expect(ClientSimule).toHaveBeenCalledWith({
      host: 'db',
      port: 5433,
      user: 'u',
      password: 'p',
      ssl: undefined,
      database: 'postgres',
    });
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ DB_HOST: 'db', POSTGRES_USER: 'u' }],
    [{ POSTGRES_USER: 'u', POSTGRES_DB: 'cible' }],
    [{ DB_HOST: 'db', POSTGRES_DB: 'cible' }],
  ])('ne se connecte pas sans base, hote ou utilisateur (%j)', async (env) => {
    await garantirLaBaseCible(resoudreConnexionPostgres(env));

    expect(ClientSimule).not.toHaveBeenCalled();
  });
});
