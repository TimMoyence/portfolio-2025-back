import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  fichiersDeMigration,
  migrationsChargees,
} from './lib/migrations-chargees.mjs';

const root = new URL('..', import.meta.url).pathname;

void test('le build produit les points d entree utilises par Docker et les migrations', () => {
  execFileSync('pnpm', ['build'], { cwd: root, stdio: 'pipe' });

  for (const file of ['dist/main.js', 'dist/database/data-source.js']) {
    assert.equal(existsSync(join(root, file)), true, file);
  }

  assert.equal(existsSync(join(root, 'dist/src/main.js')), false);
  assert.equal(
    existsSync(join(root, 'dist/src/database/data-source.js')),
    false,
  );

  const chargeesEnProduction = migrationsChargees({
    root,
    dataSource: './dist/database/data-source.js',
    viaTsNode: false,
  });
  assert.equal(chargeesEnProduction.length, fichiersDeMigration(root).length);
});

void test('les commandes de production utilisent les points d entree du build', () => {
  const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8');
  const compose = readFileSync(join(root, 'deploy/compose.yaml'), 'utf8');

  assert.match(dockerfile, /CMD \["node", "dist\/main\.js"\]/);
  assert.match(compose, /dist\/database\/data-source\.js/);
});
