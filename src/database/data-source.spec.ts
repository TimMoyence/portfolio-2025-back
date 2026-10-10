import { optionsDesMigrations } from './data-source';

describe('data-source des migrations', () => {
  it('se connecte comme l API, SSL compris', () => {
    expect(
      optionsDesMigrations({
        NODE_ENV: 'production',
        DB_HOST: 'db-migrations',
        DATABASE_USER: 'migrateur',
        DB_PASS: 'secret',
        DATABASE_NAME: 'portfolio',
        DB_SSL: 'true',
      }),
    ).toMatchObject({
      type: 'postgres',
      host: 'db-migrations',
      username: 'migrateur',
      password: 'secret',
      database: 'portfolio',
      ssl: { rejectUnauthorized: true },
    });
  });
});
