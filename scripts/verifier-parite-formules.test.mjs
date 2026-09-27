import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ecartsAvecLesAttendus,
  ecartsEntreMoteurs,
  empreinteDesVecteurs,
  lireFichierDeVecteurs,
  resultatsDesVecteurs,
  serialiserCanonique,
} from './lib/vecteurs-formules.mjs';
import { lireArguments, main } from './verifier-parite-formules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VECTEURS = join(
  ROOT,
  'src/modules/formations/domain/cours/formule.vecteurs.json',
);
const WORKFLOW = join(ROOT, '.github/workflows/ci.yml');
const SCRIPT = 'quality:parite-formules';
const EMPREINTE_DU_TABLEAU_VIDE =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';

void test('serialiserCanonique trie les cles et empreinte le tableau vide comme le domaine', () => {
  assert.equal(
    serialiserCanonique({ b: 1, a: { d: [2, 1], c: null } }),
    '{"a":{"c":null,"d":[2,1]},"b":1}',
  );
  assert.equal(empreinteDesVecteurs([]), EMPREINTE_DU_TABLEAU_VIDE);
});

void test('le fichier de vecteurs porte l empreinte de ses propres vecteurs', () => {
  const fichier = lireFichierDeVecteurs(VECTEURS);

  assert.equal(fichier.vecteurs.length, 19);
  assert.equal(empreinteDesVecteurs(fichier.vecteurs), fichier.sha256);
});

void test('lireArguments lit le depot front et le mode strict', () => {
  assert.deepEqual(lireArguments(['--front=/tmp/front', '--strict']), {
    front: '/tmp/front',
    strict: true,
  });
  assert.equal(lireArguments([]).strict, false);
  assert.match(lireArguments([]).front, /portfolio-2025-front$/);
});

void test('les comparateurs signalent un attendu manque et un desaccord de moteurs', () => {
  const vecteurs = [{ id: 'v1', type: 'r1c1', attendu: '=RC' }];

  assert.deepEqual(
    ecartsAvecLesAttendus({ v1: serialiserCanonique('=RC') }, vecteurs),
    [],
  );
  assert.equal(
    ecartsAvecLesAttendus({ v1: serialiserCanonique('=R1C1') }, vecteurs)
      .length,
    1,
  );
  assert.deepEqual(ecartsEntreMoteurs({ v1: 'a' }, { v1: 'a' }), []);
  assert.equal(ecartsEntreMoteurs({ v1: 'a' }, { v1: 'b' }).length, 1);
});

void test('un moteur qui devie des vecteurs est signale', () => {
  const fichier = lireFichierDeVecteurs(VECTEURS);
  const moteurFaux = {
    evaluerFeuille: () => new Map(),
    evaluerExpression: () => ({ valeur: 0, erreur: null }),
    formeR1C1: () => null,
  };

  const obtenus = resultatsDesVecteurs(moteurFaux, fichier.vecteurs);

  assert.equal(
    ecartsAvecLesAttendus(obtenus, fichier.vecteurs).length,
    fichier.vecteurs.length,
  );
});

void test('la verification de parite passe sur le depot tel qu il est', async () => {
  assert.equal(await main([]), 0);
});

void test('la verification de parite est branchee sur les portes du back', () => {
  const manifeste = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
  );
  const workflow = readFileSync(WORKFLOW, 'utf8');

  assert.match(manifeste.scripts[SCRIPT], /verifier-parite-formules\.mjs/);
  for (const porte of ['ci:check', 'pre-push:check']) {
    assert.ok(
      manifeste.scripts[porte].includes(`pnpm run ${SCRIPT}`),
      `${porte} ne lance pas ${SCRIPT}`,
    );
  }
  assert.ok(
    workflow.includes(`pnpm run ${SCRIPT}`),
    'le workflow ne lance pas la verification de parite',
  );
});
