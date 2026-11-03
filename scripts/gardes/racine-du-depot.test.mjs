import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { RACINE } from '../lib/racine.mjs';

const CE_QU_UN_OUTIL_CHERCHE_A_LA_RACINE = {
  '.claude/': 'Claude Code lit ses règles et réglages ici',
  '.dockerignore': 'docker build le lit à côté du contexte',
  '.editorconfig': 'les éditeurs le cherchent en remontant',
  '.env.example': 'modèle lu par env-examples.spec.ts et copié en .env',
  '.github/': 'GitHub Actions n’en lit pas d’autre',
  '.gitignore': 'git',
  '.gitleaks.toml': 'gitleaks le découvre sans option',
  '.husky/': 'core.hooksPath posé par husky',
  '.jscpd.json':
    'jscpd résout path, ignore et output depuis le dossier de sa config, que duplication-gate.test.mjs recrée tel quel',
  '.jscpd.tests.json': 'même raison que .jscpd.json',
  '.jscpd4.tests.json': 'même raison que .jscpd.json',
  '.prettierignore': 'prettier et les éditeurs le cherchent à la racine',
  'AGENTS.md': 'agents de code',
  'CLAUDE.md': 'Claude Code',
  'CONTRIBUTING.md': 'GitHub l’affiche depuis la racine',
  'README.md': 'GitHub l’affiche depuis la racine',
  Dockerfile: 'docker build et le déploiement',
  'config/': 'les configs qu’un outil lit par --config ou par package.json',
  'deploy/': 'scripts de déploiement',
  'docs/': 'documentation',
  'eslint.config.mjs':
    'ESLint et les éditeurs ne lisent la config plate qu’à la racine',
  'nest-cli.json': 'Nest CLI',
  'openapi.json': 'contrat épinglé que le front lit à ce chemin (ADR 0003)',
  'package.json': 'pnpm',
  'patches/': 'pnpm patchedDependencies',
  'pnpm-lock.yaml': 'pnpm',
  'pnpm-workspace.yaml': 'pnpm',
  'scripts/': 'outillage du dépôt',
  'src/': 'code',
  'test/': 'tests e2e, http et base',
  'tsconfig.build.json': 'tsc -p du build',
  'tsconfig.json': 'tsc et les éditeurs',
};

void test('la racine ne garde que ce qu’un outil y cherche ; une config lue par --config vit dans config/', () => {
  const sortie = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: RACINE, encoding: 'utf8' },
  );
  assert.equal(sortie.status, 0, sortie.stderr);
  const entrees = new Set(
    sortie.stdout
      .split('\n')
      .filter((chemin) => chemin && existsSync(join(RACINE, chemin)))
      .map((chemin) =>
        chemin.includes('/') ? `${chemin.split('/')[0]}/` : chemin,
      ),
  );

  assert.deepEqual(
    [...entrees]
      .filter(
        (entree) => !Object.hasOwn(CE_QU_UN_OUTIL_CHERCHE_A_LA_RACINE, entree),
      )
      .sort((a, b) => a.localeCompare(b)),
    [],
  );
});
