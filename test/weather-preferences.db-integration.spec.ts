import { DataSource, DataSourceOptions } from 'typeorm';
import { WeatherPreferencesRepositoryTypeORM } from '../src/modules/weather/infrastructure/WeatherPreferences.repository.typeORM';
import { WeatherUserPreferencesEntity } from '../src/modules/weather/infrastructure/entities/WeatherUserPreferences.entity';
import { WeatherUserPreferences } from '../src/modules/weather/domain/WeatherUserPreferences';

const runDbIntegration = process.env.RUN_DB_INTEGRATION === 'true';
const describeDb = runDbIntegration ? describe : describe.skip;

function parsePort(raw: string | undefined): number {
  if (!raw) return 5432;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 5432;
}

function buildOptions(): DataSourceOptions {
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
    entities: [WeatherUserPreferencesEntity],
    synchronize: true,
    dropSchema: true,
    logging: false,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

describeDb('WeatherPreferencesRepositoryTypeORM (db integration)', () => {
  let dataSource: DataSource;
  let repository: WeatherPreferencesRepositoryTypeORM;

  const TEST_USER_ID = '00000000-0000-4000-a000-000000000001';

  beforeAll(async () => {
    dataSource = new DataSource(buildOptions());
    await dataSource.initialize();

    repository = new WeatherPreferencesRepositoryTypeORM(
      dataSource.getRepository(WeatherUserPreferencesEntity),
    );
  });

  afterEach(async () => {
    await dataSource.getRepository(WeatherUserPreferencesEntity).clear();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('cree des preferences avec defaultCityIndex null par defaut', async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    const created = await repository.create(defaults);

    expect(created.id).toEqual(expect.any(String));
    expect(created.userId).toBe(TEST_USER_ID);
    expect(created.defaultCityIndex).toBeNull();
    expect(created.favoriteCities).toEqual([]);
    expect(created.level).toBe('discovery');
  });

  it('retrouve les preferences par userId', async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    await repository.create(defaults);

    const found = await repository.findByUserId(TEST_USER_ID);

    expect(found).not.toBeNull();
    expect(found!.userId).toBe(TEST_USER_ID);
    expect(found!.defaultCityIndex).toBeNull();
  });

  it('retourne null pour un userId inexistant', async () => {
    const found = await repository.findByUserId(
      '00000000-0000-4000-a000-999999999999',
    );
    expect(found).toBeNull();
  });

  it('met a jour defaultCityIndex avec une valeur numerique', async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    const created = await repository.create(defaults);

    const updated = await repository.update(created.id, {
      defaultCityIndex: 2,
    } as Partial<WeatherUserPreferences>);

    expect(updated.defaultCityIndex).toBe(2);
  });

  it('remet defaultCityIndex a null', async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    const created = await repository.create(defaults);

    // D'abord mettre une valeur
    await repository.update(created.id, {
      defaultCityIndex: 1,
    } as Partial<WeatherUserPreferences>);

    // Puis remettre a null
    const updated = await repository.update(created.id, {
      defaultCityIndex: null,
    } as Partial<WeatherUserPreferences>);

    expect(updated.defaultCityIndex).toBeNull();
  });

  it('met a jour favoriteCities et defaultCityIndex ensemble', async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    const created = await repository.create(defaults);

    const cities = [
      {
        name: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        country: 'France',
      },
      { name: 'Lyon', latitude: 45.764, longitude: 4.8357, country: 'France' },
    ];

    const updated = await repository.update(created.id, {
      favoriteCities: cities,
      defaultCityIndex: 0,
    } as Partial<WeatherUserPreferences>);

    expect(updated.favoriteCities).toEqual(cities);
    expect(updated.defaultCityIndex).toBe(0);
  });

  it("preserve defaultCityIndex lors de la mise a jour d'autres champs", async () => {
    const defaults = WeatherUserPreferences.create(TEST_USER_ID);
    const created = await repository.create(defaults);

    await repository.update(created.id, {
      defaultCityIndex: 3,
    } as Partial<WeatherUserPreferences>);

    const updated = await repository.update(created.id, {
      level: 'expert',
    } as Partial<WeatherUserPreferences>);

    expect(updated.level).toBe('expert');
    expect(updated.defaultCityIndex).toBe(3);
  });
});
