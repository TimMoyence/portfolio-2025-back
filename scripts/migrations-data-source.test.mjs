import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import {
  fichiersDeMigration,
  migrationsChargees,
} from './lib/migrations-chargees.mjs';

const root = new URL('..', import.meta.url).pathname;

void test('la data-source de la CLI TypeORM charge chaque migration de src/migrations sans ses specs Jest', () => {
  const chargees = migrationsChargees({
    root,
    dataSource: './src/database/data-source.ts',
    viaTsNode: true,
  });

  assert.equal(chargees.length, fichiersDeMigration(root).length);
  assert.equal(new Set(chargees).size, chargees.length);
});

const BASE_INJOIGNABLE = 'postgres://personne:rien@127.0.0.1:1/aucune';

for (const script of ['migration:generate', 'migration:new']) {
  void test(`${script} refuse de demarrer sans --name et en donne l usage`, () => {
    const resultat = spawnSync('pnpm', ['run', '--silent', script], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: BASE_INJOIGNABLE },
    });

    assert.notEqual(resultat.status, 0);
    assert.match(resultat.stderr, /--name=NomEnCamelCase/);
  });
}
