import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOTEUR = 'src/modules/formations/domain/cours/Formule.ts';
const REGLES = ['no-eval', 'no-new-func', 'no-implied-eval'];
const CONSTRUCTIONS_INTERDITES = [
  /\beval\s*\(/,
  /\bnew\s+Function\s*\(/,
  /\bFunction\s*\(\s*['"`]/,
];

/**
 * @param {unknown} niveau
 * @returns {string}
 */
const severite = (niveau) => {
  const valeur = Array.isArray(niveau) ? niveau[0] : niveau;
  return valeur === 2 || valeur === 'error' ? 'error' : String(valeur);
};

void test('le moteur de formules ne construit aucun code a l execution', () => {
  const source = readFileSync(join(ROOT, MOTEUR), 'utf8');

  for (const motif of CONSTRUCTIONS_INTERDITES) {
    assert.equal(
      motif.test(source),
      false,
      `${MOTEUR} contient une construction de code a l execution : ${motif}`,
    );
  }
});

void test('eslint interdit eval et new Function sur le moteur de formules', async () => {
  const eslint = new ESLint({ cwd: ROOT });

  const config = await eslint.calculateConfigForFile(join(ROOT, MOTEUR));

  for (const regle of REGLES) {
    assert.equal(
      severite(config.rules?.[regle]),
      'error',
      `la regle ${regle} n est pas en error sur ${MOTEUR}`,
    );
  }
});

void test('les trois regles signalent bien une construction de code', async () => {
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: {
      languageOptions: { globals: { setTimeout: 'readonly' } },
      rules: Object.fromEntries(REGLES.map((regle) => [regle, 2])),
    },
  });

  const [resultat] = await eslint.lintText(
    'eval("1+1");\nnew Function("return 1");\nsetTimeout("x()", 1);\n',
    { filePath: join(ROOT, 'moteur-virtuel.js') },
  );

  assert.deepEqual(
    resultat.messages.map((message) => message.ruleId).sort(),
    [...REGLES].sort(),
  );
});
