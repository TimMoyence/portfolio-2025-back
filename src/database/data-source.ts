import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { estEnProduction, type SourceDEnv } from '../config/env-readers.util';
import { validateEnv } from '../config/env.validation';
import {
  emplacementTypeOrm,
  resoudreConnexionPostgres,
} from './connexion-postgres';
// dotenv 17.4 n'est charge qu'hors production : en production les variables
// sont injectees par `env_file` et `environment:` du service migrate de
// compose.yaml.
if (!estEnProduction()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv/config');
}

export function optionsDesMigrations(
  source: SourceDEnv = process.env,
): DataSourceOptions {
  if (estEnProduction(source)) {
    validateEnv(source);
  }
  return {
    type: 'postgres',
    ...emplacementTypeOrm(resoudreConnexionPostgres(source)),
    entities: ['dist/**/*.entity.js'],
    migrations: [__dirname + '/../migrations/!(*.spec).{js,ts}'],
  };
}

export default new DataSource(optionsDesMigrations());
