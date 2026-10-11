import { garantirLaBaseCible } from './ensure-database';
import { optionsTypeOrmDeLApi } from './options-typeorm';

jest.mock('./ensure-database', () => ({
  garantirLaBaseCible: jest.fn().mockResolvedValue(undefined),
}));

describe('optionsTypeOrmDeLApi', () => {
  it('compose l emplacement partage avec les migrations, le pool et les entites', async () => {
    const options = await optionsTypeOrmDeLApi('dist/**/*.entity.js', {
      DB_HOST: 'db',
      POSTGRES_USER: 'u',
      POSTGRES_DB: 'portfolio',
      DB_SSL: 'true',
      DB_POOL_MAX: '12',
    });

    expect(options).toEqual({
      type: 'postgres',
      entities: ['dist/**/*.entity.js'],
      synchronize: false,
      extra: {
        max: 12,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      },
      host: 'db',
      username: 'u',
      database: 'portfolio',
      ssl: { rejectUnauthorized: false },
    });
    expect(garantirLaBaseCible).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'db', database: 'portfolio' }),
    );
  });

  it('ne synchronise le schema que hors production et sur demande', async () => {
    const enDev = await optionsTypeOrmDeLApi('e', { DB_SYNCHRONIZE: 'true' });
    const enProd = await optionsTypeOrmDeLApi('e', {
      DB_SYNCHRONIZE: 'true',
      NODE_ENV: 'production',
    });

    expect(enDev.synchronize).toBe(true);
    expect(enProd.synchronize).toBe(false);
  });

  it('synchronise des qu un alias le demande, meme apres un alias a false', async () => {
    const options = await optionsTypeOrmDeLApi('e', {
      TYPEORM_SYNCHRONIZE: 'false',
      DB_SYNCHRONIZE: 'true',
    });

    expect(options.synchronize).toBe(true);
  });

  it('retombe sur les valeurs du pool quand la variable n est pas un nombre', async () => {
    const options = await optionsTypeOrmDeLApi('e', {
      DB_POOL_MAX: 'beaucoup',
    });

    expect(options.extra).toEqual(expect.objectContaining({ max: 30 }));
  });
});
