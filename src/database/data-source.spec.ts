import {
  buildProductionSecrets,
  buildValidEnv,
} from '../../test/factories/env.factory';
import { optionsDesMigrations } from './data-source';

const ENV_DE_PRODUCTION = {
  ...buildValidEnv(buildProductionSecrets()),
  NODE_ENV: 'production',
  DB_HOST: 'db-migrations',
  DATABASE_USER: 'migrateur',
  DB_PASS: 'secret',
  DB_NAME: undefined,
  DATABASE_NAME: 'portfolio',
  DB_SSL: 'true',
};

describe('data-source des migrations', () => {
  it('se connecte comme l API, SSL compris', () => {
    expect(optionsDesMigrations(ENV_DE_PRODUCTION)).toMatchObject({
      type: 'postgres',
      host: 'db-migrations',
      username: 'migrateur',
      password: 'secret',
      database: 'portfolio',
      ssl: { rejectUnauthorized: true },
    });
  });

  it.each<[string, Record<string, unknown>]>([
    ['un secret trop court', { JWT_SECRET_PREVIOUS: 's'.repeat(24) }],
    ['une URL sans base', { DATABASE_URL: 'postgres://u:p@db:5432' }],
    [
      'un secret HMAC partage avec les JWT',
      {
        MORNING_BRIEF_HMAC_KEYS: `mb:${String(buildValidEnv().JWT_SECRET)}`,
      },
    ],
  ])(
    'refuse en production, avant toute migration, l env que l API refuserait : %s',
    (_cas, surcharge) => {
      expect(() =>
        optionsDesMigrations({ ...ENV_DE_PRODUCTION, ...surcharge }),
      ).toThrow('[ENV VALIDATION]');
    },
  );

  it('laisse hors production les migrations sur la seule connexion, comme migration:run:dev', () => {
    expect(
      optionsDesMigrations({ DB_HOST: 'localhost', DB_NAME: 'portfolio_dev' }),
    ).toMatchObject({ host: 'localhost', database: 'portfolio_dev' });
  });
});
