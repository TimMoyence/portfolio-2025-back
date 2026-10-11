import { buildDbIntegrationOptions } from './helpers/db-integration-datasource';

describe('buildDbIntegrationOptions — base videe a chaque suite', () => {
  it('vise la base de CI locale quand rien n est renseigne', () => {
    expect(buildDbIntegrationOptions([], {})).toEqual(
      expect.objectContaining({
        host: '127.0.0.1',
        port: 5432,
        database: 'portfolio_2025_ci',
        dropSchema: true,
      }),
    );
  });

  it('ignore DATABASE_URL, dont la connexion imposerait sa base au nom verifie', () => {
    const options = buildDbIntegrationOptions([], {
      DATABASE_URL: 'postgres://u:p@prod:5432/portfolio',
      DB_NAME: 'portfolio_2025_ci',
    });

    expect(options).not.toHaveProperty('url');
    expect(options).toEqual(
      expect.objectContaining({
        host: '127.0.0.1',
        database: 'portfolio_2025_ci',
      }),
    );
  });

  it.each([[{ POSTGRES_DB: 'portfolio_dev' }], [{ DB_NAME: 'portfolio' }]])(
    'refuse de vider une base qui n est pas jetable (%j)',
    (source) => {
      expect(() => buildDbIntegrationOptions([], source)).toThrow(/refusée/);
    },
  );
});
