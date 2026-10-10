import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import type { SourceDEnv } from '../config/env-readers.util';
import {
  emplacementTypeOrm,
  resoudreConnexionPostgres,
} from './connexion-postgres';
// dotenv 17.4 n'est charge qu'hors production : en production les variables
// sont injectees par le bloc `environment:` du service api de compose.yaml.
const nodeEnv = (process.env.NODE_ENV ?? '').trim();
if (nodeEnv !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv/config');
}

export function optionsDesMigrations(
  source: SourceDEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    ...emplacementTypeOrm(resoudreConnexionPostgres(source)),
    entities: ['dist/**/*.entity.js'],
    migrations: [__dirname + '/../migrations/!(*.spec).{js,ts}'],
  };
}

export default new DataSource(optionsDesMigrations());
