import {
  emplacementTypeOrm,
  resoudreConnexionPostgres,
} from './connexion-postgres';

describe('resoudreConnexionPostgres', () => {
  it.each([
    [{ DB_HOST: 'a', DATABASE_HOST: 'b', PGHOST: 'c' }, 'a'],
    [{ DATABASE_HOST: 'b', PGHOST: 'c' }, 'b'],
    [{ PGHOST: 'c' }, 'c'],
  ])(
    'lit l hote dans l ordre DB_HOST, DATABASE_HOST, PGHOST (%j)',
    (env, hote) => {
      expect(resoudreConnexionPostgres(env).host).toBe(hote);
    },
  );

  it.each([
    [{ DB_USERNAME: 'a', DB_USER: 'b' }, 'a'],
    [{ DB_USER: 'b', DATABASE_USER: 'c' }, 'b'],
    [{ DATABASE_USER: 'c', POSTGRES_USER: 'd' }, 'c'],
    [{ POSTGRES_USER: 'd' }, 'd'],
  ])('lit l utilisateur par ses quatre alias (%j)', (env, utilisateur) => {
    expect(resoudreConnexionPostgres(env).username).toBe(utilisateur);
  });

  it.each([
    [{ DB_PASSWORD: 'a', DB_PASS: 'b' }, 'a'],
    [{ DB_PASS: 'b', DATABASE_PASSWORD: 'c' }, 'b'],
    [{ DATABASE_PASSWORD: 'c', POSTGRES_PASSWORD: 'd' }, 'c'],
    [{ POSTGRES_PASSWORD: 'd' }, 'd'],
  ])('lit le mot de passe par ses quatre alias (%j)', (env, motDePasse) => {
    expect(resoudreConnexionPostgres(env).password).toBe(motDePasse);
  });

  it.each([
    [{ DB_NAME: 'a', DATABASE_NAME: 'b', POSTGRES_DB: 'c' }, 'a'],
    [{ DATABASE_NAME: 'b', POSTGRES_DB: 'c' }, 'b'],
    [{ POSTGRES_DB: 'c', DB_DATABASE: 'd' }, 'c'],
    [{ DB_DATABASE: 'd' }, 'd'],
    [{ DATABASE_URL: 'postgres://u:p@h:5432/depuis_url' }, 'depuis_url'],
  ])('lit le nom de la base par ses alias puis par l URL (%j)', (env, base) => {
    expect(resoudreConnexionPostgres(env).database).toBe(base);
  });

  it('lit le port par ses alias et le rend numerique', () => {
    expect(resoudreConnexionPostgres({ PGPORT: '6543' }).port).toBe(6543);
    expect(
      resoudreConnexionPostgres({ DB_PORT: '5433', DATABASE_PORT: '5434' })
        .port,
    ).toBe(5433);
  });

  it('ignore une variable vide ou blanche et passe a l alias suivant', () => {
    const connexion = resoudreConnexionPostgres({
      DB_HOST: '  ',
      PGHOST: 'pg',
      DB_PASSWORD: '',
      POSTGRES_PASSWORD: 'secret',
      DATABASE_URL: ' ',
    });

    expect(connexion.host).toBe('pg');
    expect(connexion.password).toBe('secret');
    expect(connexion.url).toBeUndefined();
  });

  it('ne leve pas sur une URL invalide et ne deduit alors aucune base', () => {
    expect(
      resoudreConnexionPostgres({ DATABASE_URL: 'pas une url' }).database,
    ).toBeUndefined();
  });

  it('active SSL quel que soit la casse et ne verifie le certificat qu en production', () => {
    expect(resoudreConnexionPostgres({ DB_SSL: 'TRUE' }).ssl).toEqual({
      rejectUnauthorized: false,
    });
    expect(
      resoudreConnexionPostgres({
        DATABASE_SSL: 'true',
        NODE_ENV: 'production',
      }).ssl,
    ).toEqual({ rejectUnauthorized: true });
    expect(resoudreConnexionPostgres({ DB_SSL: 'false' }).ssl).toBeUndefined();
  });

  it('retient la base d administration declaree, postgres sinon', () => {
    expect(resoudreConnexionPostgres({}).baseAdmin).toBe('postgres');
    expect(
      resoudreConnexionPostgres({ DATABASE_ADMIN_NAME: 'admin' }).baseAdmin,
    ).toBe('admin');
  });
});

describe('emplacementTypeOrm', () => {
  it('prefere l URL aux identifiants et garde la base et SSL', () => {
    const emplacement = emplacementTypeOrm(
      resoudreConnexionPostgres({
        DATABASE_URL: 'postgres://u:p@h:5432/x',
        DB_HOST: 'ignore',
        DB_NAME: 'cible',
        DB_SSL: 'true',
      }),
    );

    expect(emplacement).toEqual({
      url: 'postgres://u:p@h:5432/x',
      database: 'cible',
      ssl: { rejectUnauthorized: false },
    });
  });

  it('rend les seuls identifiants renseignes quand il n y a pas d URL', () => {
    expect(
      emplacementTypeOrm(
        resoudreConnexionPostgres({
          DB_HOST: 'db',
          DB_PORT: '5432',
          POSTGRES_USER: 'u',
          POSTGRES_DB: 'portfolio',
        }),
      ),
    ).toEqual({
      host: 'db',
      port: 5432,
      username: 'u',
      database: 'portfolio',
    });
  });
});
