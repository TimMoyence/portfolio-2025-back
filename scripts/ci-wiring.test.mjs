import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = join(ROOT, 'test');
const WORKFLOW_PATH = join(ROOT, '.github/workflows/ci.yml');
const SUFFIXE_DB_INTEGRATION = '.db-integration.spec.ts';

/** @param {string} chemin @returns {unknown} */
const lireJson = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'));

/** @returns {string[]} */
const suitesDbIntegrationReelles = () =>
  readdirSync(TEST_DIR).filter((nom) => nom.endsWith(SUFFIXE_DB_INTEGRATION));

/**
 * @param {{ testRegex?: string, testPathIgnorePatterns?: string[] }} config
 * @param {string} nomFichier
 * @returns {boolean}
 */
const priseParConfig = (config, nomFichier) => {
  const regex = new RegExp(config.testRegex ?? '(?!)');
  if (!regex.test(nomFichier)) return false;
  const exclusions = config.testPathIgnorePatterns ?? [];
  return !exclusions.some((motif) => new RegExp(motif).test(nomFichier));
};

/**
 * @param {Record<string, string>} scripts
 * @param {string} fragmentConfig
 * @returns {string[]}
 */
const scriptsPourConfig = (scripts, fragmentConfig) =>
  Object.entries(scripts)
    .filter(([, commande]) => commande.includes(fragmentConfig))
    .map(([nom]) => nom);

/**
 * @param {string} texteWorkflow
 * @returns {Record<string, string>}
 */
const blocsDesJobs = (texteWorkflow) => {
  const lignes = texteWorkflow.split('\n');
  const debutJobs = lignes.findIndex((ligne) => /^jobs:\s*$/.test(ligne));
  assert.ok(debutJobs >= 0, 'le workflow ne declare aucune section jobs:');
  /** @type {Record<string, string>} */
  const blocs = {};
  let jobCourant = null;
  let depart = -1;
  for (let i = debutJobs + 1; i <= lignes.length; i += 1) {
    const ligne = lignes[i] ?? '';
    const entete = /^ {2}([a-zA-Z0-9_-]+):\s*$/.exec(ligne);
    if (entete || i === lignes.length) {
      if (jobCourant !== null) {
        blocs[jobCourant] = lignes.slice(depart, i).join('\n');
      }
      if (entete) {
        jobCourant = entete[1];
        depart = i;
      }
    }
  }
  return blocs;
};

/**
 * @param {Record<string, string>} jobs
 * @param {string[]} nomsDeScripts
 * @returns {[string, string] | undefined}
 */
const jobQuiLance = (jobs, nomsDeScripts) =>
  Object.entries(jobs).find(([, bloc]) =>
    nomsDeScripts.some((nom) => bloc.includes(`pnpm run ${nom}`)),
  );

void test('chaque suite *.db-integration.spec.ts reelle est prise par une configuration jest branchee sur le workflow', () => {
  const manifest = lireJson(join(ROOT, 'package.json'));
  const configDbIntegration = lireJson(
    join(TEST_DIR, 'jest-db-integration.json'),
  );
  const configCharge = lireJson(join(TEST_DIR, 'jest-charge.json'));
  const workflow = readFileSync(WORKFLOW_PATH, 'utf8');
  const jobs = blocsDesJobs(workflow);

  const scriptsDbIntegration = scriptsPourConfig(
    manifest.scripts,
    './test/jest-db-integration.json',
  );
  const scriptsCharge = scriptsPourConfig(
    manifest.scripts,
    './test/jest-charge.json',
  );

  assert.ok(
    scriptsDbIntegration.length > 0,
    'aucun script de package.json ne lance jest-db-integration.json',
  );
  assert.ok(
    scriptsCharge.length > 0,
    'aucun script de package.json ne lance jest-charge.json',
  );

  const jobDbIntegration = jobQuiLance(jobs, scriptsDbIntegration);
  const jobCharge = jobQuiLance(jobs, scriptsCharge);

  assert.ok(
    jobDbIntegration,
    'aucun job du workflow ne lance le script associe a jest-db-integration.json',
  );
  assert.ok(
    jobCharge,
    'aucun job du workflow ne lance le script associe a jest-charge.json',
  );

  const suites = suitesDbIntegrationReelles();
  assert.ok(
    suites.length > 0,
    'aucune suite *.db-integration.spec.ts trouvee dans test/',
  );

  for (const suite of suites) {
    const priseParDbIntegration = priseParConfig(configDbIntegration, suite);
    const priseParCharge = priseParConfig(configCharge, suite);
    assert.ok(
      priseParDbIntegration || priseParCharge,
      `${suite} n est prise par aucune configuration jest connue (db-integration ou charge)`,
    );
  }
});

void test('les jobs bloquant et non bloquant sont correctement marques dans le workflow', () => {
  const manifest = lireJson(join(ROOT, 'package.json'));
  const workflow = readFileSync(WORKFLOW_PATH, 'utf8');
  const jobs = blocsDesJobs(workflow);

  const scriptsDbIntegration = scriptsPourConfig(
    manifest.scripts,
    './test/jest-db-integration.json',
  );
  const scriptsCharge = scriptsPourConfig(
    manifest.scripts,
    './test/jest-charge.json',
  );

  const jobDbIntegration = jobQuiLance(jobs, scriptsDbIntegration);
  const jobCharge = jobQuiLance(jobs, scriptsCharge);

  assert.ok(
    jobDbIntegration,
    'aucun job du workflow ne lance le script associe a jest-db-integration.json',
  );
  assert.ok(
    jobCharge,
    'aucun job du workflow ne lance le script associe a jest-charge.json',
  );

  const [, blocJobDbIntegration] = jobDbIntegration;
  const [nomJobCharge, blocJobCharge] = jobCharge;

  assert.ok(
    !/continue-on-error:\s*true/.test(blocJobDbIntegration),
    'le job qui lance jest-db-integration.json ne doit pas etre marque continue-on-error: il doit rester bloquant',
  );
  assert.ok(
    /continue-on-error:\s*true/.test(blocJobCharge),
    `le job "${nomJobCharge}" qui lance la suite de charge doit etre marque continue-on-error: true pour rester visible sans bloquer la fusion`,
  );
});

void test('les suites de resilience et de concurrence sont prises par la configuration db-integration bloquante', () => {
  const configDbIntegration = lireJson(
    join(TEST_DIR, 'jest-db-integration.json'),
  );
  const suites = suitesDbIntegrationReelles();

  const resilience = suites.filter((suite) => /resilience/.test(suite));
  const concurrence = suites.filter((suite) => /concurrence/.test(suite));

  assert.ok(
    resilience.length > 0,
    'aucune suite de resilience trouvee dans test/*.db-integration.spec.ts',
  );
  assert.ok(
    concurrence.length > 0,
    'aucune suite de concurrence trouvee dans test/*.db-integration.spec.ts',
  );

  for (const suite of [...resilience, ...concurrence]) {
    assert.ok(
      priseParConfig(configDbIntegration, suite),
      `${suite} devrait etre prise par jest-db-integration.json (porte bloquante)`,
    );
  }
});
