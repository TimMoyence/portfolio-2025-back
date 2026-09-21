import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const FICHIER_DE_MIGRATION = /^\d+-[\w-]+\.ts$/;

/**
 * @param {string} dataSource
 * @returns {string}
 */
const scriptDeChargement = (dataSource) => `
const dataSource = require(${JSON.stringify(dataSource)}).default;
const { ConnectionMetadataBuilder } = require('typeorm/connection/ConnectionMetadataBuilder');
new ConnectionMetadataBuilder(dataSource)
  .buildMigrations(dataSource.options.migrations)
  .then((migrations) => {
    process.stdout.write(JSON.stringify(migrations.map((migration) => migration.constructor.name)));
  });
`;

/**
 * @param {{ root: string, dataSource: string, viaTsNode: boolean }} input
 * @returns {string[]}
 */
export function migrationsChargees({ root, dataSource, viaTsNode }) {
  const prechargement = viaTsNode ? ['-r', 'ts-node/register'] : [];
  const sortie = execFileSync(
    'node',
    [...prechargement, '-e', scriptDeChargement(dataSource)],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' },
    },
  );
  return JSON.parse(sortie);
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function fichiersDeMigration(root) {
  return readdirSync(join(root, 'src/migrations')).filter(
    (nom) => FICHIER_DE_MIGRATION.test(nom) && !nom.endsWith('.spec.ts'),
  );
}
