import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { fichiersDeMigration } from './lib/migrations-chargees.mjs';
import { prochainHorodatage } from './lib/prochain-horodatage.mjs';
import { RACINE as root } from './lib/racine.mjs';

void test('reprend l horloge quand elle depasse la derniere migration', () => {
  assert.equal(prochainHorodatage(['1000-A.ts', '2000-B.ts'], 5000), 5000);
});

void test('se place juste apres la derniere migration quand elle est datee dans le futur', () => {
  assert.equal(
    prochainHorodatage(['1790900000000-B.ts', '1000-A.ts'], 1790284323449),
    1790900000001,
  );
});

void test('la CLI donne un horodatage posterieur a toutes les migrations du depot', () => {
  const derniere = Math.max(
    ...fichiersDeMigration(root).map((nom) => Number(nom.split('-')[0])),
  );

  const sortie = execFileSync(
    'node',
    ['scripts/prochain-horodatage-migration.mjs'],
    {
      cwd: root,
      encoding: 'utf8',
    },
  );

  assert.ok(Number(sortie.trim()) > derniere);
});

void test('migration:generate impose cet horodatage a la CLI TypeORM', () => {
  const { scripts } = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8'),
  );

  assert.match(
    scripts['migration:generate'],
    /--timestamp "\$\(node scripts\/prochain-horodatage-migration\.mjs\)"/,
  );
});
