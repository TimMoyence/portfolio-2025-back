import { join } from 'path';
import type { DataSource } from 'typeorm';
import {
  attendreSchemaAligneSurLesEntites,
  describeDb,
  destroyDbIntegrationDataSource,
  initBaseMigree,
} from './helpers/db-integration-datasource';

const TOUTES_LES_ENTITES = join(__dirname, '../src/**/*.entity.ts');
const TOUTES_LES_MIGRATIONS = join(__dirname, '../src/migrations/!(*.spec).ts');
const DELAI_MIGRATIONS_MS = 120_000;

describeDb('Schema de la base migree face aux entites', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await initBaseMigree(
      [TOUTES_LES_ENTITES],
      [TOUTES_LES_MIGRATIONS],
    );
  }, DELAI_MIGRATIONS_MS);

  afterAll(async () => {
    await destroyDbIntegrationDataSource(dataSource);
  });

  it('ne laisse a migration:generate aucune requete a proposer', async () => {
    await attendreSchemaAligneSurLesEntites(dataSource);
  });
});
