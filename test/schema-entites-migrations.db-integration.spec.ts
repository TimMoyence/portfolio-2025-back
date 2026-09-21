import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  buildDbIntegrationOptions,
  describeDb,
  destroyDbIntegrationDataSource,
} from './helpers/db-integration-datasource';

const TOUTES_LES_ENTITES = join(__dirname, '../src/**/*.entity.ts');
const TOUTES_LES_MIGRATIONS = join(__dirname, '../src/migrations/!(*.spec).ts');
const FONCTIONS_HORS_DU_DROP_SCHEMA = [
  '"reject_formation_course_content_change"()',
];
const DELAI_MIGRATIONS_MS = 120_000;

describeDb('Schema de la base migree face aux entites', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...buildDbIntegrationOptions([TOUTES_LES_ENTITES]),
      synchronize: false,
      migrations: [TOUTES_LES_MIGRATIONS],
    });
    await dataSource.initialize();
    for (const fonction of FONCTIONS_HORS_DU_DROP_SCHEMA) {
      await dataSource.query(`DROP FUNCTION IF EXISTS ${fonction} CASCADE`);
    }
    await dataSource.runMigrations({ transaction: 'all' });
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  it('ne laisse a migration:generate aucune requete a proposer', async () => {
    const derive = await dataSource.driver.createSchemaBuilder().log();

    expect(derive.upQueries.map((requete) => requete.query)).toEqual([]);
  });
});
