import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { RACINE as ROOT } from './lib/racine.mjs';

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

void test('le deploiement sauvegarde la base, puis migre, puis remplace l api', () => {
  const jobs = blocsDesJobs(readFileSync(WORKFLOW_PATH, 'utf8'));
  const deploiement = Object.values(jobs).find((bloc) =>
    bloc.includes('run --rm migrate'),
  );
  assert.ok(deploiement, 'aucun job du workflow ne lance migrate');
  const commandes = deploiement
    .split('\n')
    .map((ligne) => ligne.replace(/(^|\s)#.*$/, ''))
    .join('\n');

  const rotation =
    /ls -1t "\$SAUVEGARDES"\/avant-migrate-\*\.dump \| tail -n \+(\d+) \| xargs -r rm -f --\n/;
  const etapes = [
    /script: \|\n\s*set -euo pipefail\n/,
    /mkdir -p "\$SAUVEGARDES"\n\s*chmod 700 "\$SAUVEGARDES"\n/,
    /exec -T db \\\n\s*sh -c 'pg_dump -U "\$POSTGRES_USER" -d "\$1" --format=custom' sauvegarde "\$BASE_MIGREE" \\\n\s*> "\$SAUVEGARDES\/avant-migrate-[^"\n]*\.dump"\n/,
    rotation,
    /run --rm migrate\n/,
    /up -d --no-deps --wait /,
  ];
  const rangs = etapes.map((etape) => commandes.search(etape));

  assert.ok(
    rangs.every((rang) => rang >= 0),
    `etapes absentes du deploiement : ${etapes.filter((_, i) => rangs[i] < 0).join(', ')}`,
  );
  assert.deepEqual(
    [...rangs].sort((gauche, droite) => gauche - droite),
    rangs,
    'le deploiement doit s arreter a la premiere erreur, fermer le dossier des sauvegardes, sauvegarder la base avant migrate, et migrer avant de remplacer l api',
  );
  assert.deepEqual(
    commandes.match(/(^|\n)\s*set \+\S*/g),
    null,
    'le deploiement ne doit jamais rendre une erreur muette avant de remplacer l api',
  );
  assert.equal(
    Number(rotation.exec(commandes)?.[1]) - 1,
    5,
    'la rotation doit garder les cinq dernieres sauvegardes, la neuve comprise',
  );
});

const scriptDuDeploiement = () => {
  const jobs = blocsDesJobs(readFileSync(WORKFLOW_PATH, 'utf8'));
  const deploiement = Object.values(jobs).find((bloc) =>
    bloc.includes('run --rm migrate'),
  );
  assert.ok(deploiement, 'aucun job du workflow ne lance migrate');
  const lignes = deploiement.split('\n');
  const debut = lignes.findIndex((ligne) => /^\s*script: \|\s*$/.test(ligne));
  assert.ok(debut >= 0, 'le deploiement ne porte aucun script: |');
  const retrait = /^\s*/.exec(lignes[debut + 1] ?? '')?.[0] ?? '';
  const corps = [];
  for (const ligne of lignes.slice(debut + 1)) {
    if (ligne.trim() !== '' && !ligne.startsWith(retrait)) break;
    corps.push(ligne.slice(retrait.length));
  }
  return corps
    .join('\n')
    .replace(
      /\$\{\{\s*([^}]+?)\s*\}\}/g,
      (_, expression) => `faux-${String(expression).replace(/\W+/g, '-')}`,
    );
};

const fauxDocker = () => {
  const { appendFileSync } = process.getBuiltinModule('node:fs');
  const { spawnSync } = process.getBuiltinModule('node:child_process');
  const args = String(process.env.FAUX_ARGS).split('\u001f').slice(0, -1);
  appendFileSync(
    String(process.env.JOURNAL_DOCKER),
    `${JSON.stringify(args)}\n`,
  );
  let i = 1;
  while (['-p', '-f', '--env-file'].includes(args[i] ?? '')) i += 2;
  const [sousCommande, ...reste] = args.slice(i);
  if (args[0] !== 'compose' || !['exec', 'run'].includes(sousCommande ?? '')) {
    process.exit(0);
  }
  const ajouts = new Map();
  let entree = null;
  let j = 0;
  while ((reste[j] ?? '').startsWith('-')) {
    if (reste[j] === '-e' || reste[j] === '--env') {
      const [cle, ...valeur] = String(reste[j + 1]).split('=');
      ajouts.set(cle, valeur.join('='));
      j += 2;
    } else if (reste[j] === '--entrypoint') {
      entree = reste[j + 1];
      j += 2;
    } else {
      j += 1;
    }
  }
  const [service, ...commande] = reste.slice(j);
  if (sousCommande === 'run' && entree === null) process.exit(0);
  const envDuService = JSON.parse(
    String(
      service === 'db' ? process.env.FAUX_ENV_DB : process.env.FAUX_ENV_MIGRATE,
    ),
  );
  const executable = entree ?? String(commande[0]);
  const { status } = spawnSync(
    executable,
    entree === null ? commande.slice(1) : commande,
    {
      stdio: 'inherit',
      env: {
        PATH: process.env.PATH,
        JOURNAL_PG_DUMP: process.env.JOURNAL_PG_DUMP,
        FAUX_PG_DUMP_EXIT: process.env.FAUX_PG_DUMP_EXIT,
        ...envDuService,
        ...Object.fromEntries(ajouts),
      },
    },
  );
  process.exit(status ?? 1);
};

const fauxPgDump = () => {
  const { appendFileSync } = process.getBuiltinModule('node:fs');
  appendFileSync(
    String(process.env.JOURNAL_PG_DUMP),
    `${JSON.stringify(String(process.env.FAUX_ARGS).split('\u001f').slice(0, -1))}\n`,
  );
  process.stdout.write('sauvegarde');
  process.exit(Number(process.env.FAUX_PG_DUMP_EXIT));
};

/** @param {string} chemin @returns {string[][]} */
const lireJournal = (chemin) =>
  existsSync(chemin)
    ? readFileSync(chemin, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((ligne) => JSON.parse(ligne))
    : [];

/**
 * @param {{ envDuMigrate: Record<string, string>, envDuDb: Record<string, string>, dumpEchoue?: boolean }} cas
 */
const jouerLeDeploiement = ({ envDuMigrate, envDuDb, dumpEchoue = false }) => {
  const dossier = mkdtempSync(join(tmpdir(), 'deploiement-'));
  try {
    return jouerLeDeploiementDans(dossier, {
      envDuMigrate,
      envDuDb,
      dumpEchoue,
    });
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
};

/**
 * @param {string} dossier
 * @param {{ envDuMigrate: Record<string, string>, envDuDb: Record<string, string>, dumpEchoue: boolean }} cas
 */
const jouerLeDeploiementDans = (
  dossier,
  { envDuMigrate, envDuDb, dumpEchoue },
) => {
  const bin = join(dossier, 'bin');
  const travail = join(dossier, 'travail');
  mkdirSync(bin);
  mkdirSync(travail);
  for (const [nom, faux] of [
    ['docker', fauxDocker],
    ['pg_dump', fauxPgDump],
  ]) {
    const programme = join(bin, `${String(nom)}.cjs`);
    writeFileSync(programme, `(${String(faux)})();\n`);
    writeFileSync(
      join(bin, String(nom)),
      `#!/usr/bin/env bash\nFAUX_ARGS="$(printf '%s\\037' "$@")" exec node "${programme}"\n`,
      { mode: 0o755 },
    );
  }
  writeFileSync(join(dossier, 'deploiement.sh'), scriptDuDeploiement());
  const journalDocker = join(dossier, 'docker.jsonl');
  const journalPgDump = join(dossier, 'pg_dump.jsonl');
  const resultat = spawnSync('bash', [join(dossier, 'deploiement.sh')], {
    encoding: 'utf8',
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      DEPLOY_PATH: travail,
      JOURNAL_DOCKER: journalDocker,
      JOURNAL_PG_DUMP: journalPgDump,
      FAUX_ENV_MIGRATE: JSON.stringify(envDuMigrate),
      FAUX_ENV_DB: JSON.stringify(envDuDb),
      FAUX_PG_DUMP_EXIT: dumpEchoue ? '1' : '0',
    },
  });
  const appels = lireJournal(journalDocker);
  const rangDe = (/** @type {(appel: string[]) => boolean} */ critere) =>
    appels.findIndex(critere);
  const migre = (/** @type {string[]} */ appel) =>
    appel.includes('run') &&
    appel.includes('migrate') &&
    !appel.includes('--entrypoint');
  const remplaceLApi = (/** @type {string[]} */ appel) => appel.includes('up');
  return {
    code: resultat.status,
    sortie: `${resultat.stdout}${resultat.stderr}`,
    basesSauvegardees: lireJournal(journalPgDump).map(
      (argumentsDuDump) => argumentsDuDump[argumentsDuDump.indexOf('-d') + 1],
    ),
    rangDuPull: rangDe((appel) => appel.includes('pull')),
    rangDuDump: rangDe(
      (appel) => appel.includes('exec') && appel.includes('db'),
    ),
    rangDeMigrate: rangDe(migre),
    rangDuRemplacement: rangDe(remplaceLApi),
    sauvegardes: existsSync(join(travail, 'sauvegardes'))
      ? readdirSync(join(travail, 'sauvegardes'))
      : [],
  };
};

const ENV_DU_DB_FIGEE = {
  POSTGRES_USER: 'proprietaire',
  POSTGRES_DB: 'base-figee-a-la-creation-du-conteneur-db',
};

void test('le deploiement sauvegarde la base que migrate va migrer, lue dans backend.env comme par la regle de l env', () => {
  const deploiement = jouerLeDeploiement({
    envDuMigrate: { POSTGRES_DB: 'base-de-backend-env' },
    envDuDb: ENV_DU_DB_FIGEE,
  });

  assert.equal(deploiement.code, 0, deploiement.sortie);
  assert.deepEqual(deploiement.basesSauvegardees, ['base-de-backend-env']);
  assert.ok(
    deploiement.rangDuDump >= 0 &&
      deploiement.rangDuDump < deploiement.rangDeMigrate &&
      deploiement.rangDeMigrate < deploiement.rangDuRemplacement,
    'la sauvegarde precede migrate, qui precede le remplacement de l api',
  );
  assert.equal(deploiement.sauvegardes.length, 1);
});

for (const [cas, entree, basesAttendues] of /** @type {const} */ ([
  [
    'pg_dump echoue',
    {
      envDuMigrate: { POSTGRES_DB: 'base-de-backend-env' },
      envDuDb: ENV_DU_DB_FIGEE,
      dumpEchoue: true,
    },
    ['base-de-backend-env'],
  ],
  [
    'backend.env ne nomme aucune POSTGRES_DB',
    { envDuMigrate: {}, envDuDb: ENV_DU_DB_FIGEE },
    [],
  ],
  [
    'backend.env porte une POSTGRES_DB vide',
    { envDuMigrate: { POSTGRES_DB: '' }, envDuDb: ENV_DU_DB_FIGEE },
    [],
  ],
])) {
  void test(`le deploiement s arrete avant migrate quand ${cas}`, () => {
    const deploiement = jouerLeDeploiement(entree);

    assert.notEqual(deploiement.code, 0, deploiement.sortie);
    assert.ok(deploiement.rangDuPull >= 0, deploiement.sortie);
    assert.deepEqual(deploiement.basesSauvegardees, basesAttendues);
    assert.equal(deploiement.rangDeMigrate, -1, 'migrate ne doit pas tourner');
    assert.equal(
      deploiement.rangDuRemplacement,
      -1,
      'l api ne doit pas etre remplacee',
    );
  });
}

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
