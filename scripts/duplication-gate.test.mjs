import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOTEURS = {
  v5: join(ROOT, 'node_modules/jscpd/run-jscpd.js'),
  v4: join(ROOT, 'node_modules/jscpd4/bin/jscpd'),
};
const PORTES = {
  app: { v5: '.jscpd.json', v4: '.jscpd.json' },
  tests: { v5: '.jscpd.tests.json', v4: '.jscpd4.tests.json' },
};
const JETONS_MINIMAUX = 30;

const CANARI = `export function canari(entree: number[]): number {
  let total = 0;
  for (const valeur of entree) {
    total += valeur * 2;
  }
  return total;
}
`;

const TEMOIN = `export const temoin = [
  'un',
  'deux',
  'trois',
  'quatre',
];
`;
const TEMOINS = ['src/temoin.ts', 'src/temoin.spec.ts'];

/** @param {string} chemin @returns {Record<string, unknown>} */
const lireJson = (chemin) => JSON.parse(readFileSync(chemin, 'utf8'));

/**
 * @param {'v4' | 'v5'} moteur
 * @param {keyof typeof PORTES} porte
 * @param {readonly string[]} fichiersPlantes
 * @returns {{ statut: number | null, clones: number }}
 */
const verdictSurDepotPlante = (moteur, porte, fichiersPlantes) => {
  const depot = mkdtempSync(join(tmpdir(), 'porte-cpd-'));
  try {
    const nomConfig = PORTES[porte][moteur];
    const rapport = join(depot, 'rapport');
    const config = {
      ...lireJson(join(ROOT, nomConfig)),
      reporters: ['json'],
      output: rapport,
    };
    writeFileSync(join(depot, nomConfig), JSON.stringify(config));
    for (const dossier of /** @type {string[]} */ (config.path)) {
      mkdirSync(join(depot, dossier), { recursive: true });
    }
    for (const fichier of fichiersPlantes) {
      mkdirSync(dirname(join(depot, fichier)), { recursive: true });
      writeFileSync(join(depot, fichier), CANARI);
    }
    for (const temoin of TEMOINS) {
      writeFileSync(join(depot, temoin), TEMOIN);
    }
    const resultat = spawnSync(
      process.execPath,
      [MOTEURS[moteur], '--config', nomConfig],
      { cwd: depot, encoding: 'utf8' },
    );
    const { duplicates } = /** @type {{ duplicates: unknown[] }} */ (
      lireJson(join(rapport, 'jscpd-report.json'))
    );
    return { statut: resultat.status, clones: duplicates.length };
  } finally {
    rmSync(depot, { recursive: true, force: true });
  }
};

const CAS = [
  {
    porte: 'app',
    detecte: ['src/modules/a/un.ts', 'src/modules/b/deux.ts'],
    ignore: [
      ['src/modules/a/un.spec.ts', 'src/modules/b/deux.spec.ts'],
      ['src/migrations/1-un.ts', 'src/migrations/2-deux.ts'],
    ],
  },
  {
    porte: 'tests',
    detecte: ['src/modules/a/un.spec.ts', 'test/helpers/deux.ts'],
    ignore: [
      ['src/modules/a/un.ts', 'src/modules/b/deux.ts'],
      ['src/main.ts', 'src/app.module.ts'],
    ],
  },
];

for (const moteur of /** @type {const} */ (['v5', 'v4'])) {
  for (const cas of CAS) {
    void test(`jscpd ${moteur} : la porte ${cas.porte} échoue sur un clone canari de son périmètre`, () => {
      assert.deepEqual(verdictSurDepotPlante(moteur, cas.porte, cas.detecte), {
        statut: 1,
        clones: 1,
      });
    });

    for (const horsPerimetre of cas.ignore) {
      void test(`jscpd ${moteur} : la porte ${cas.porte} ne compte pas ${horsPerimetre.join(' + ')}`, () => {
        assert.deepEqual(
          verdictSurDepotPlante(moteur, cas.porte, horsPerimetre),
          { statut: 0, clones: 0 },
        );
      });
    }
  }
}

void test('les configs des deux moteurs imposent 30 jetons, 5 lignes, seuil 0 et lèvent le plafond de taille de jscpd 4', () => {
  for (const porte of Object.values(PORTES)) {
    for (const nomConfig of Object.values(porte)) {
      const config = lireJson(join(ROOT, nomConfig));
      assert.equal(config.minTokens, JETONS_MINIMAUX, nomConfig);
      assert.equal(config.minLines, 5, nomConfig);
      assert.equal(config.threshold, 0, nomConfig);
      assert.ok(Number(config.maxLines) >= 100_000, nomConfig);
    }
  }
});

void test('chaque porte lance les deux moteurs, et ci:check comme pre-push:check lancent chaque porte', () => {
  const scripts = /** @type {Record<string, string>} */ (
    lireJson(join(ROOT, 'package.json')).scripts
  );
  const workflow = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
  for (const [script, porte] of [
    ['quality:cpd', PORTES.app],
    ['quality:cpd:tests', PORTES.tests],
  ]) {
    const commande = scripts[script] ?? '';
    assert.match(
      commande,
      new RegExp(`jscpd --config ${porte.v5.replaceAll('.', '\\.')}`),
    );
    assert.match(
      commande,
      new RegExp(
        `jscpd4/bin/jscpd --config ${porte.v4.replaceAll('.', '\\.')}`,
      ),
    );
    assert.ok(scripts['ci:check'].includes(`pnpm run ${script} `), script);
    assert.ok(
      scripts['pre-push:check'].includes(`pnpm run ${script} `),
      script,
    );
    assert.ok(workflow.includes(`pnpm run ${script}\n`), script);
  }
});
