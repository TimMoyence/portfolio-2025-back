import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

import { RACINE } from './racine.mjs';

const SOURCE = fileURLToPath(new URL('./racine.mjs', import.meta.url));

const PROPRIETAIRES_DE_LA_RACINE = new Set([
  'scripts/lib/racine.mjs',
  'scripts/lib/racine.test.mjs',
  'test/helpers/racine.ts',
]);
const MODULES = new Map([
  ['path', 'chemin'],
  ['node:path', 'chemin'],
  ['path/posix', 'chemin'],
  ['node:path/posix', 'chemin'],
  ['path/win32', 'chemin'],
  ['node:path/win32', 'chemin'],
  ['fs', 'fichiers'],
  ['node:fs', 'fichiers'],
  ['fs/promises', 'fichiers'],
  ['node:fs/promises', 'fichiers'],
  ['url', 'adresse'],
  ['node:url', 'adresse'],
  ['process', 'processus'],
  ['node:process', 'processus'],
  ['typescript', 'typescript'],
]);
const FAMILLES_DE_MODULES = new Set(MODULES.values());
const CHEMINS_DE_TS_SYS = new Set([
  'readFile',
  'writeFile',
  'fileExists',
  'directoryExists',
  'createDirectory',
  'readDirectory',
  'getDirectories',
  'resolvePath',
  'realpath',
  'getFileSize',
  'getModifiedTime',
  'setModifiedTime',
  'deleteFile',
  'watchFile',
  'watchDirectory',
]);
const CHEMINS_DE_TYPESCRIPT = new Set([
  'readConfigFile',
  'readJsonConfigFile',
  'findConfigFile',
  'getParsedCommandLineOfConfigFile',
]);
const EXTENSIONS_IMPORTABLES = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
];
const SOUS_MODULES = new Map([
  ['chemin', new Set(['posix', 'win32'])],
  ['fichiers', new Set(['promises'])],
]);
const GLOBALES = new Map([
  ['process', 'processus'],
  ['globalThis', 'global'],
  ['global', 'global'],
  ['require', 'require'],
  ['module', 'module'],
  ['Reflect', 'reflet'],
]);
const CALCULS_DE_CHEMIN = new Set(['join', 'resolve', 'dirname', 'normalize']);
const FONCTIONS_A_DEUX_CHEMINS = new Set([
  'copyFile',
  'copyFileSync',
  'cp',
  'cpSync',
  'rename',
  'renameSync',
  'link',
  'linkSync',
  'symlink',
  'symlinkSync',
]);
const NOMS_DU_REPERTOIRE_COURANT = new Set([
  'cwd',
  'chdir',
  'PWD',
  'OLDPWD',
  'INIT_CWD',
  'getCurrentDirectory',
  'mainModule',
]);
const NOMS_DE_L_EMPLACEMENT_DU_PAQUET = new Set([
  'PNPM_SCRIPT_SRC_DIR',
  'npm_package_json',
  'npm_config_local_prefix',
]);
const MODULES_D_EMPLACEMENT = new Set([
  'app-root-path',
  'find-up',
  'locate-path',
  'pkg-dir',
]);
const NOMS_SUSPECTS = new Map([
  ...[...MODULES_D_EMPLACEMENT].map((nom) => [
    nom,
    `module d emplacement : ${nom}`,
  ]),
  ...[...NOMS_DU_REPERTOIRE_COURANT].map((nom) => [
    nom,
    `répertoire courant : ${nom}`,
  ]),
  ...[...NOMS_DE_L_EMPLACEMENT_DU_PAQUET].map((nom) => [
    nom,
    `emplacement du paquet : ${nom}`,
  ]),
  ['testPath', 'emplacement du test : testPath'],
]);
const RACINE_PAR_GIT = /--show-(?:toplevel|cdup)\b/;
const SEGMENT_INCONNU = 'segment';

const CALCULS_DE_RACINE = {
  'test/helpers/filename.ts': [
    "import { dirname, join } from 'node:path';\nexport const R = join(dirname(__filename), '../..');\n",
    ['__filename'],
  ],
  'test/helpers/gabarit.ts': [
    'export const R = `${__dirname}/../..`;\n',
    ['mène à .'],
  ],
  'test/helpers/constante.ts': [
    "import { join } from 'node:path';\nconst HAUT = '../..';\nexport const R = join(__dirname, HAUT);\n",
    ['mène à .'],
  ],
  'test/helpers/constante-as-const.ts': [
    "import { join } from 'node:path';\nconst HAUT = '../..' as const;\nexport const R = join(__dirname, (HAUT));\n",
    ['mène à .'],
  ],
  'test/helpers/constante-concatenee.ts': [
    "import { join } from 'node:path';\nconst HAUT = '..' + '/..';\nexport const R = join(__dirname, HAUT);\n",
    ['mène à .'],
  ],
  'test/helpers/require-resolve.ts': [
    "import { dirname } from 'node:path';\nexport const R = dirname(require.resolve('../../package.json'));\n",
    ['mène à .', 'mène à package.json'],
  ],
  'test/helpers/require-main.ts': [
    'export const R = require.main?.filename;\n',
    ['require.main'],
  ],
  'scripts/module-path.cjs': [
    "const { join } = require('node:path');\nmodule.exports = join(module.path, '..');\n",
    ['module.path'],
  ],
  'scripts/argv.mjs': [
    "import { dirname, join } from 'node:path';\nexport const R = join(dirname(process.argv[1]), '..');\n",
    ['process.argv hors de slice(2)'],
  ],
  'scripts/argv-destructure.mjs': [
    'const [, script] = process.argv;\nexport const R = script;\n',
    ['process.argv hors de slice(2)'],
  ],
  'test/helpers/resolve-point.ts': [
    "import { resolve } from 'node:path';\nexport const R = resolve('.');\n",
    ['resolve depuis le répertoire courant'],
  ],
  'test/helpers/resolve-vide.ts': [
    "import * as path from 'node:path';\nexport const R = path.resolve();\n",
    ['resolve depuis le répertoire courant'],
  ],
  'test/helpers/resolve-posix.ts': [
    "import path from 'node:path';\nexport const R = path.posix.resolve('.');\nexport const W = path.win32.resolve('.');\n",
    [
      'resolve depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/resolve-module-posix.ts': [
    "import { resolve } from 'node:path/posix';\nexport const R = resolve();\n",
    ['resolve depuis le répertoire courant'],
  ],
  'test/helpers/lecture-relative.ts': [
    "import { readFileSync } from 'node:fs';\nexport const P = readFileSync('package.json', 'utf8');\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-fs-nu.ts': [
    "import { readFileSync } from 'fs';\nexport const P = readFileSync('package.json', 'utf8');\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-fs-promises.ts': [
    "import { readFile } from 'fs/promises';\nexport const P = readFile('package.json');\n",
    ['readFile depuis le répertoire courant'],
  ],
  'test/helpers/lecture-node-fs-promises.ts': [
    "import { readFile } from 'node:fs/promises';\nexport const P = readFile('package.json');\n",
    ['readFile depuis le répertoire courant'],
  ],
  'test/helpers/lecture-promises-alias.ts': [
    "import { promises as fs } from 'node:fs';\nexport const P = fs.readFile('package.json');\n",
    ['readFile depuis le répertoire courant'],
  ],
  'test/helpers/lecture-point-promises.ts': [
    "import fs from 'node:fs';\nexport const P = fs.promises.readFile('package.json');\n",
    ['readFile depuis le répertoire courant'],
  ],
  'test/helpers/lecture-require-imbrique.ts': [
    "export function lire() {\n  const fs = require('node:fs');\n  return fs.readFileSync('package.json');\n}\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-import-egal.ts': [
    "import fs = require('node:fs');\nexport const P = fs.readFileSync('package.json');\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-relative-jointe.ts': [
    "import { existsSync } from 'node:fs';\nimport { join } from 'node:path';\nexport const P = existsSync(join('src', 'main.ts'));\n",
    ['existsSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-concatenee.ts': [
    "import { readFileSync } from 'node:fs';\nexport const P = readFileSync('src/' + 'main.ts');\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-gabarit.ts': [
    "import { readFileSync } from 'node:fs';\nexport const P = (nom: string) => readFileSync(`src/${nom}.ts`);\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/adresse-relative.ts': [
    "import { pathToFileURL } from 'node:url';\nexport const U = pathToFileURL('package.json');\n",
    ['pathToFileURL depuis le répertoire courant'],
  ],
  'test/helpers/dirname-dirname.ts': [
    "import { dirname } from 'node:path';\nexport const R = dirname(dirname(__dirname));\n",
    ['mène à .'],
  ],
  'test/helpers/dirname-join.ts': [
    "import { dirname, join } from 'node:path';\nexport const R = dirname(join(__dirname, '..'));\n",
    ['mène à .'],
  ],
  'test/helpers/resolve-join.ts': [
    "import { join, resolve } from 'node:path';\nexport const R = resolve(join(__dirname, '..'), '..');\n",
    ['mène à .'],
  ],
  'test/helpers/deux-temps.ts': [
    "import { join } from 'node:path';\nconst TESTS = join(__dirname, '..');\nexport const R = join(TESTS, '..');\n",
    ['mène à .'],
  ],
  'src/a/b/c/sources.ts': [
    "import { dirname, join } from 'node:path';\nconst SOURCES = join(__dirname, '../../..');\nexport const R = dirname(SOURCES);\n",
    ['mène à .'],
  ],
  'test/helpers/remonte-un-import.ts': [
    "import { dirname } from 'node:path';\nimport { ICI } from './ici';\nexport const R = dirname(ICI);\n",
    ['mène à .'],
  ],
  'test/helpers/virgules.ts': [
    "import { join } from 'node:path';\nexport const R = join(__dirname, '..', '..');\n",
    ['mène à .'],
  ],
  'test/helpers/alias.ts': [
    "import { join as joindre } from 'node:path';\nexport const R = joindre(__dirname, '../..');\n",
    ['mène à .'],
  ],
  'test/helpers/espace-de-chemin.ts': [
    "import path from 'node:path';\nexport const R = path.join(__dirname, '../..');\n",
    ['mène à .'],
  ],
  'test/helpers/multiligne.ts': [
    "import { join } from 'node:path';\nexport const R = join(\n  __dirname,\n  '..',\n  '..',\n);\n",
    ['mène à .'],
  ],
  'src/sonde/sort-de-src.ts': [
    "import { join } from 'node:path';\nexport const R = join(__dirname, '../../test/fixtures');\n",
    ['mène à test/fixtures'],
  ],
  'test/helpers/concatenation.ts': [
    "export const R = __dirname + '/../..';\n",
    ['mène à .'],
  ],
  'test/helpers/concatenation-en-chaine.ts': [
    "export const R = __dirname + '/' + '../..';\n",
    ['mène à .'],
  ],
  'test/helpers/concatenation-de-fichier.ts': [
    "import { readFileSync } from 'node:fs';\nexport const P = readFileSync(__dirname + '/' + '../../package.json');\n",
    ['mène à package.json'],
  ],
  'test/helpers/concatenation-sep.ts': [
    "import { sep } from 'node:path';\nexport const R = __dirname + sep + '..' + sep + '..';\n",
    ['mène à .'],
  ],
  'test/helpers/docs.ts': [
    "import { readFileSync } from 'node:fs';\nimport { join } from 'node:path';\nexport const D = readFileSync(join(__dirname, '../..', 'docs/x.md'), 'utf8');\n",
    ['mène à docs/x.md'],
  ],
  'test/helpers/affectation.ts': [
    'const ici = __dirname;\nexport const R = ici;\n',
    ['__dirname hors d un calcul de chemin'],
  ],
  'scripts/require-nomme.cjs': [
    "const { resolve: resoudre } = require('node:path');\nmodule.exports = resoudre('.');\n",
    ['resolve depuis le répertoire courant'],
  ],
  'test/helpers/dirname-concatene.ts': [
    "import { dirname } from 'node:path';\nexport const R = dirname(__dirname + '/..');\n",
    ['mène à .'],
  ],
  'test/helpers/cwd-renomme.ts': [
    'const { cwd: ici } = process;\nexport const R = ici();\n',
    ['répertoire courant : cwd'],
  ],
  'scripts/require-espace.cjs': [
    "const path = require('path');\nmodule.exports = path.join(__dirname, '..');\n",
    ['mène à .'],
  ],
  'scripts/meta-resolve.mjs': [
    "import { fileURLToPath } from 'node:url';\nexport const R = fileURLToPath(import.meta.resolve('./'));\n",
    ['import.meta'],
  ],
  'test/helpers/repertoire-courant.mts': [
    'export const R = process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/repertoire-courant.cts': [
    'export const R = process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/repertoire-courant.jsx': [
    'export const R = process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/repertoire-courant.tsx': [
    'export const R = process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-importe.ts': [
    "import { cwd } from 'node:process';\nexport const R = cwd();\n",
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-destructure.ts': [
    'const { cwd } = process;\nexport const R = cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-indexe.ts': [
    "export const R = process['cwd']();\n",
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-calcule.ts': [
    "export const R = process['c' + 'wd']();\n",
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-global.ts': [
    'export const R = globalThis.process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'test/helpers/cwd-typescript.ts': [
    "import ts from 'typescript';\nexport const R = ts.sys.getCurrentDirectory();\n",
    ['répertoire courant : getCurrentDirectory'],
  ],
  'test/helpers/pwd.ts': [
    'export const R = process.env.PWD ?? process.env.INIT_CWD;\n',
    ['répertoire courant : PWD', 'répertoire courant : INIT_CWD'],
  ],
  'test/helpers/pwd-indexe.ts': [
    "export const R = process.env['PWD'];\n",
    ['répertoire courant : PWD'],
  ],
  'test/helpers/pwd-importe.ts': [
    "import { env } from 'node:process';\nexport const R = env.PWD;\n",
    ['répertoire courant : PWD'],
  ],
  'test/helpers/init-cwd.ts': [
    'export const R = process.env.INIT_CWD;\n',
    ['répertoire courant : INIT_CWD'],
  ],
  'test/helpers/init-cwd-destructure.ts': [
    'const { INIT_CWD } = process.env;\nexport const R = INIT_CWD;\n',
    ['répertoire courant : INIT_CWD'],
  ],
  'test/helpers/oldpwd.ts': [
    'export const R = process.env.OLDPWD;\n',
    ['répertoire courant : OLDPWD'],
  ],
  'test/helpers/git.ts': [
    "import { execSync } from 'node:child_process';\nexport const R = execSync('git rev-parse --show-toplevel');\nexport const H = execSync('git rev-parse --show-cdup');\n",
    ['git rev-parse --show-toplevel', 'git rev-parse --show-cdup'],
  ],
  'test/helpers/cwd-exporte.ts': [
    "export { cwd } from 'node:process';\n",
    ['répertoire courant : cwd'],
  ],
  'test/helpers/chdir.ts': [
    "process.chdir('..');\n",
    ['répertoire courant : chdir'],
  ],
  'test/helpers/main-module.ts': [
    'export const R = process.mainModule?.path;\n',
    ['répertoire courant : mainModule'],
  ],
  'scripts/simple.js': [
    'module.exports = process.cwd();\n',
    ['répertoire courant : cwd'],
  ],
  'scripts/argv-global.mjs': [
    'export const R = [globalThis.process.argv[1], global.process.argv[0]];\n',
    ['process.argv hors de slice(2)', 'process.argv hors de slice(2)'],
  ],
  'scripts/argv-importe.mjs': [
    "import { argv } from 'node:process';\nexport const R = argv[1];\n",
    ['process.argv hors de slice(2)'],
  ],
  'scripts/argv-slice-un.mjs': [
    'export const R = process.argv.slice(1);\nexport const T = process.argv.slice();\n',
    ['process.argv hors de slice(2)', 'process.argv hors de slice(2)'],
  ],
  'test/helpers/modules-nus.ts': [
    "import { resolve as r1 } from 'path/posix';\nimport { resolve as r2 } from 'path/win32';\nimport { resolve as r3 } from 'node:path/win32';\nimport { pathToFileURL } from 'url';\nimport { argv } from 'process';\nexport const R = [r1(), r2(), r3(), pathToFileURL('package.json'), argv[1]];\n",
    [
      'resolve depuis le répertoire courant',
      'resolve depuis le répertoire courant',
      'resolve depuis le répertoire courant',
      'pathToFileURL depuis le répertoire courant',
      'process.argv hors de slice(2)',
    ],
  ],
  'test/helpers/deux-chemins.ts': [
    "import * as fs from 'node:fs';\nimport { join } from 'node:path';\nconst ICI = join(__dirname, 'x');\nconst rien = () => undefined;\nfs.copyFile(ICI, 'copie', rien);\nfs.copyFileSync(ICI, 'copie');\nfs.cp(ICI, 'copie', rien);\nfs.cpSync(ICI, 'copie');\nfs.rename(ICI, 'copie', rien);\nfs.renameSync(ICI, 'copie');\nfs.link(ICI, 'copie', rien);\nfs.linkSync(ICI, 'copie');\nfs.symlink(ICI, 'copie', rien);\nfs.symlinkSync(ICI, 'copie');\n",
    [
      'copyFile depuis le répertoire courant',
      'copyFileSync depuis le répertoire courant',
      'cp depuis le répertoire courant',
      'cpSync depuis le répertoire courant',
      'rename depuis le répertoire courant',
      'renameSync depuis le répertoire courant',
      'link depuis le répertoire courant',
      'linkSync depuis le répertoire courant',
      'symlink depuis le répertoire courant',
      'symlinkSync depuis le répertoire courant',
    ],
  ],
  'scripts/lib/remonte.mjs': [
    "import { readFileSync } from 'node:fs';\nimport { ICI } from './ici.mjs';\nexport const P = readFileSync(ICI);\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/lecture-dossier.ts': [
    "import { readdirSync } from 'node:fs';\nimport { dirname } from 'node:path';\nexport const L = readdirSync(dirname('src/main.ts'));\n",
    ['readdirSync depuis le répertoire courant'],
  ],
  'test/helpers/normalise-puis-remonte.ts': [
    "import { dirname, normalize } from 'node:path';\nexport const R = dirname(dirname(normalize(__dirname)));\n",
    ['mène à .'],
  ],
  'test/helpers/enveloppes.ts': [
    "import { join } from 'node:path';\nconst HAUT = '../..';\nconst A = '../..' satisfies string;\nconst B = <string>'../..';\nexport const R = [join(__dirname, A), join(__dirname, B), join(__dirname, HAUT!), join((__dirname as string), '..', '..')];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/resolve-indexe.ts': [
    "import * as path from 'node:path';\nexport const R = path['resolve']('.');\n",
    ['resolve depuis le répertoire courant'],
  ],
  'test/helpers/fs-indexe.ts': [
    "import * as fs from 'node:fs';\nexport const P = (k: 'readFileSync') => fs[k]('package.json');\n",
    ['[clé calculée] depuis le répertoire courant'],
  ],
  'scripts/argv-at.mjs': [
    'export const R = process.argv.at(2);\n',
    ['process.argv hors de slice(2)'],
  ],
  'test/helpers/dirname-lu.ts': [
    "import { readdirSync } from 'node:fs';\nexport const L = readdirSync(__dirname);\n",
    ['__dirname hors d un calcul de chemin'],
  ],
  'test/helpers/voisin.ts': [
    "import { join } from 'node:path';\nexport const V = join(__dirname, '../../testing');\n",
    ['mène à testing'],
  ],
  'test/helpers/depuis-src.ts': [
    "import { dirname } from 'node:path';\nimport { SOURCES } from '../../src/sources-sonde';\nexport const R = dirname(SOURCES);\n",
    ['mène à .'],
  ],
  'src/depuis-test.ts': [
    "import { dirname } from 'node:path';\nimport { FIXTURES } from '../test/helpers/fixtures-sonde';\nexport const R = dirname(FIXTURES);\n",
    ['mène à .'],
  ],
  'test/helpers/via-reexport-nomme.ts': [
    "import { join } from 'node:path';\nimport { HAUT } from './reexport-nomme';\nimport { MONTEE } from './reexport-renomme';\nimport { LOCAL } from './export-local-renomme';\nexport const R = [join(__dirname, HAUT), join(__dirname, MONTEE), join(__dirname, LOCAL)];\n",
    ['mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/via-reexport-tout.ts': [
    "import { join } from 'node:path';\nimport { HAUT } from './reexport-tout';\nexport const R = join(__dirname, HAUT);\n",
    ['mène à .'],
  ],
  'test/helpers/via-index.ts': [
    "import { join } from 'node:path';\nimport { HAUT } from './haut-dossier';\nexport const R = join(__dirname, HAUT);\n",
    ['mène à .'],
  ],
  'test/helpers/via-espace-et-defaut.ts': [
    "import { join } from 'node:path';\nimport * as H from './haut-sonde';\nimport HAUT from './haut-defaut';\nexport const R = [join(__dirname, H.HAUT), join(__dirname, HAUT)];\n",
    ['mène à .', 'mène à .'],
  ],
  'test/helpers/import-dynamique.ts': [
    "export const P = async () => {\n  const fs = await import('node:fs');\n  const { resolve } = await import('node:path');\n  return [fs.readFileSync('package.json'), resolve(), (await import('node:path')).resolve('.')];\n};\n",
    [
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/realpath-natif.ts': [
    "import { realpathSync } from 'node:fs';\nimport * as fs from 'node:fs';\nimport { resolve } from 'node:path';\nexport const R = [realpathSync.native('.'), fs.readFileSync.call(fs, 'package.json'), resolve.call(null)];\n",
    [
      'realpathSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/resolve-paths.ts': [
    "export const P = require.resolve.paths('typescript');\n",
    ['require.resolve.paths'],
  ],
  'test/helpers/chemin-du-test.ts': [
    'export const T = expect.getState().testPath;\n',
    ['emplacement du test : testPath'],
  ],
  'scripts/argv-imbrique.mjs': [
    "const { argv: [, s] } = process;\nconst { argv: { 1: t } } = process;\nconst { argv: { '0': u } } = process;\nconst { argv: [, ...reste] } = process;\nconst { argv: [, ...[script]] } = process;\nexport const R = [s, t, u, reste, script];\n",
    [
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
    ],
  ],
  'scripts/argv-reste-d-objet.mjs': [
    'const { ...p } = process;\nexport const R = p.argv[1];\n',
    ['process.argv hors de slice(2)'],
  ],
  'scripts/argv-cle-calculee.mjs': [
    "const UN = 1;\nconst { argv: { [UN]: a } } = process;\nconst { argv: { ['1']: b } } = process;\nconst { argv: { [1]: c } } = process;\nexport const f = (k) => {\n  const { argv: { [k]: d } } = process;\n  return d;\n};\nconst { argv: { 1n: e } } = process;\nexport const R = [a, b, c, e];\n",
    [
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
      'process.argv hors de slice(2)',
    ],
  ],
  'scripts/emplacement-du-paquet.mjs': [
    "const { npm_package_json: j } = process.env;\nexport const P = [\n  process.env.PNPM_SCRIPT_SRC_DIR,\n  process.env['npm_package_json'],\n  process.env.npm_config_local_prefix,\n  j,\n];\n",
    [
      'emplacement du paquet : npm_package_json',
      'emplacement du paquet : PNPM_SCRIPT_SRC_DIR',
      'emplacement du paquet : npm_package_json',
      'emplacement du paquet : npm_config_local_prefix',
    ],
  ],
  'test/helpers/liaison-calculee.ts': [
    "import fs from 'node:fs';\nimport path from 'node:path';\nimport * as E from './haut-sonde';\nconst NOM = 'readFileSync';\nconst { [NOM]: lire } = fs;\nconst { ['resolve']: resoudre } = path;\nconst { HAUT } = E;\nexport const L = lire('package.json');\nexport const R = resoudre('.');\nexport const H = path.join(__dirname, HAUT);\nexport const C = (k: 'resolve') => {\n  const { [k]: inconnue } = path;\n  return [path[k]('.'), inconnue('.')];\n};\n",
    [
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
      'mène à .',
      'resolve depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/racine-blanchie.ts': [
    "import { resolve } from 'node:path';\nimport { RACINE } from './racine';\nimport { SOURCES } from '../../src/sources-sonde';\nexport const R = resolve(RACINE, __dirname, '../..');\nexport const S = resolve(RACINE, SOURCES, '..');\n",
    ['mène à .', 'mène à .'],
  ],
  'test/helpers/via-reexport-espace.ts': [
    "import { join } from 'node:path';\nimport { H } from './relais-espace';\nexport const R = join(__dirname, H.HAUT);\n",
    ['mène à .'],
  ],
  'test/helpers/import-dynamique-local.ts': [
    "import { join } from 'node:path';\nexport const f = async () => {\n  const { HAUT } = await import('./haut-sonde');\n  return join(__dirname, HAUT);\n};\n",
    ['mène à .'],
  ],
  'scripts/import-dynamique-local.mjs': [
    "import { readFileSync } from 'node:fs';\nexport const f = async () => {\n  const { NOM } = await import('./nom-sonde.mjs');\n  return readFileSync(NOM, 'utf8');\n};\n",
    ['readFileSync depuis le répertoire courant'],
  ],
  'test/helpers/require-local.ts': [
    "import { join } from 'node:path';\nconst { HAUT } = require('./haut-sonde');\nexport const R = join(__dirname, HAUT);\n",
    ['mène à .'],
  ],
  'scripts/defaut-dynamique.mjs': [
    "export const f = async () => {\n  const { default: fs } = await import('node:fs');\n  return [fs.readFileSync('package.json', 'utf8'), (await import('node:path')).default.resolve('.')];\n};\n",
    [
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/apply.ts': [
    "import * as fs from 'node:fs';\nimport { readFileSync } from 'node:fs';\nimport { resolve } from 'node:path';\nexport const P = [fs.readFileSync.apply(fs, ['package.json']), Reflect.apply(readFileSync, undefined, ['package.json']), resolve.apply(null, ['.'])];\n",
    [
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
    ],
  ],
  'test/helpers/litteraux.ts': [
    "import { dirname, join } from 'node:path';\nconst O = { ici: join(__dirname, '..') };\nconst A = [join(__dirname, '..')] as const;\nconst { ici } = O;\nconst [premier] = A;\nexport const R = [dirname(O.ici), dirname(A[0]), dirname(O['ici']), dirname(ici), dirname(premier)];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'scripts/process-copie.mjs': [
    'const p = { ...process };\nconst o = { p: process };\nexport const R = [p.argv[1], o.p.argv[1]];\n',
    ['process.argv hors de slice(2)', 'process.argv hors de slice(2)'],
  ],
  'test/helpers/emplacement-tiers.ts': [
    "import appRoot from 'app-root-path';\nimport { packageDirectorySync } from 'pkg-dir';\nconst trouver = require('find-up');\nconst situer = require('locate-path');\nexport const R = [appRoot.path, packageDirectorySync(), trouver, situer];\n",
    [
      'module d emplacement : app-root-path',
      'module d emplacement : pkg-dir',
      'module d emplacement : find-up',
      'module d emplacement : locate-path',
    ],
  ],
  'test/helpers/ts-sys.ts': [
    "import ts from 'typescript';\nimport { sys } from 'typescript';\nexport const R = [ts.sys.readFile('package.json'), ts.sys.resolvePath('.'), sys.fileExists('src/main.ts')];\n",
    [
      'readFile depuis le répertoire courant',
      'resolvePath depuis le répertoire courant',
      'fileExists depuis le répertoire courant',
    ],
  ],
  'test/helpers/arguments-etales.ts': [
    "import * as fs from 'node:fs';\nimport { readFileSync } from 'node:fs';\nconst ARGUMENTS = ['package.json'] as const;\nexport const P = [readFileSync(...(['package.json'] as const)), fs.readFileSync.call(fs, ...(['package.json'] as const)), fs.readFileSync.apply(fs, ARGUMENTS), readFileSync(...ARGUMENTS)];\n",
    [
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
    ],
  ],
  'test/helpers/lie.ts': [
    "import * as fs from 'node:fs';\nimport { resolve } from 'node:path';\nconst lire = fs.readFileSync.bind(fs);\nconst lirePaquet = fs.readFileSync.bind(fs, 'package.json');\nconst ici = resolve.bind(null);\nexport const P = [lire('package.json'), lirePaquet(), ici('.'), Reflect.apply(lirePaquet, undefined, [])];\n",
    [
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
      'resolve depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
    ],
  ],
  'test/helpers/lie-sans-appel.ts': [
    "import * as fs from 'node:fs';\nexport const lirePaquet = fs.readFileSync.bind(fs, 'package.json');\nexport const P = Promise.resolve().then(fs.readFileSync.bind(fs).bind(null, 'package.json'));\n",
    [
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
    ],
  ],
  'test/helpers/import-dynamique-commun.ts': [
    "import { join } from 'node:path';\nexport const f = async () => {\n  const { default: haut } = await import('../../scripts/haut-entier.cjs');\n  return join(__dirname, haut, '..');\n};\n",
    ['mène à .'],
  ],
  'test/helpers/reflet-global.ts': [
    "import { readFileSync } from 'node:fs';\nexport const P = [globalThis.Reflect.apply(readFileSync, undefined, ['package.json']), globalThis['Reflect'].apply(readFileSync, undefined, ['package.json'])];\n",
    [
      'readFileSync depuis le répertoire courant',
      'readFileSync depuis le répertoire courant',
    ],
  ],
  'test/helpers/ts-config.ts': [
    "import ts from 'typescript';\nimport { findConfigFile } from 'typescript';\nconst hote = { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined };\nexport const R = [ts.readConfigFile('tsconfig.json', ts.sys.readFile), findConfigFile('.', ts.sys.fileExists), ts.readJsonConfigFile('tsconfig.json', ts.sys.readFile), ts.getParsedCommandLineOfConfigFile('tsconfig.json', {}, hote)];\n",
    [
      'readConfigFile depuis le répertoire courant',
      'findConfigFile depuis le répertoire courant',
      'readJsonConfigFile depuis le répertoire courant',
      'getParsedCommandLineOfConfigFile depuis le répertoire courant',
    ],
  ],
  'test/helpers/constantes-nommees.ts': [
    "import { dirname, join } from 'node:path';\nclass Chemins {\n  static readonly ICI = join(__dirname, '..');\n}\nenum Haut {\n  DEUX = '../..',\n}\nconst A = [join(__dirname, '..')] as const;\nconst RANG = 0;\nconst { [RANG]: premier } = A;\nexport const R = [dirname(Chemins.ICI), join(__dirname, Haut.DEUX), dirname(A[RANG]), dirname(premier)];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'scripts/require-commun.cjs': [
    "const { dirname, join } = require('path');\nconst { HAUT } = require('./haut-commun.cjs');\nconst { BAS } = require('./haut-commun.cjs');\nconst ENTIER = require('./haut-entier.cjs');\nconst { EXPORTE } = require('./haut-exports.cjs');\nmodule.exports = [join(__dirname, HAUT), join(__dirname, BAS), join(__dirname, ENTIER), join(__dirname, EXPORTE), dirname(dirname(require('./chemin-commun.cjs')))];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/specificateur-js.ts': [
    "import { join } from 'node:path';\nimport { HAUT } from './haut-sonde.js';\nimport haut from '../../scripts/haut-commun.cjs';\nimport { HAUT as MODULE } from './haut-module.mjs';\nimport { HAUT as COMMUN } from './haut-commun-type.cjs';\nimport { HAUT as VUE } from './haut-vue.jsx';\nexport const R = [join(__dirname, HAUT), join(__dirname, haut.HAUT, '..'), join(__dirname, MODULE), join(__dirname, COMMUN), join(__dirname, VUE)];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/emplacement-sous-chemin.ts': [
    "import appRoot from 'app-root-path/index.js';\nconst trouver = require('find-up/index.js');\nexport const R = [appRoot, trouver];\n",
    ['module d emplacement : app-root-path', 'module d emplacement : find-up'],
  ],
  'test/helpers/litteraux-formes.ts': [
    "import { dirname, join } from 'node:path';\nconst ici = join(__dirname, '..');\nconst K = 'ici';\nconst DERNIERE = { ici: join(__dirname, 'x'), ...{ ici: join(__dirname, '..') } };\nconst RACCOURCI = { ici };\nconst CALCULEE = { [K]: join(__dirname, '..') };\nconst SUIVIE = { ici: join(__dirname, '..'), ...{} };\nconst T = [...['a', 'b'], join(__dirname, '..')] as const;\nexport const R = [dirname(DERNIERE.ici), dirname(RACCOURCI.ici), dirname(CALCULEE.ici), dirname(SUIVIE.ici), dirname(T[2])];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/etalement-cycle-releve.ts': [
    "import { dirname } from 'node:path';\nimport { P } from './etalement-cycle-b';\nexport const R = [dirname(P.a), P.absente];\n",
    ['mène à .'],
  ],
  'scripts/etalement-commun-cycle-lecteur.cjs': [
    "const { join } = require('path');\nconst A = require('./etalement-commun-cycle-a.cjs');\nmodule.exports = [join(__dirname, A.HAUT), A.absente, require('./etalement-commun-cycle-b.cjs').absente];\n",
    ['mène à .'],
  ],
  'scripts/cycle-nom-lecteur.cjs': [
    "const { dirname, join } = require('path');\nmodule.exports = [join(__dirname, require('./cycle-entier-a.cjs').X), join(__dirname, require('./cycle-liaison-a.cjs').X), dirname(__dirname)];\n",
    ['mène à .'],
  ],
  'test/helpers/cycle-nom-lecteur.ts': [
    "import { dirname, join } from 'node:path';\nimport { X } from './cycle-nomme-a';\nimport { Y } from './cycle-importe-a';\nexport const R = [join(__dirname, X), join(__dirname, Y), dirname(dirname(__dirname))];\n",
    ['mène à .'],
  ],
  'scripts/ordre-par-a.cjs': [
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./ordre-a.cjs').HAUT);\n",
    ['mène à .'],
  ],
  'scripts/ordre-par-b.cjs': [
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./ordre-b.cjs').HAUT);\n",
    ['mène à .'],
  ],
  'scripts/croise-par-a.cjs': [
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./croise-a.cjs').HAUT);\n",
    ['mène à .'],
  ],
  'scripts/relue-1-par-a.cjs': [
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./relue-a.cjs').HAUT);\n",
    ['mène à .'],
  ],
  'scripts/relue-2-par-b.cjs': [
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./relue-b.cjs').HAUT);\n",
    ['mène à .'],
  ],
  'scripts/indice-commun-lecteur.cjs': [
    "const { join } = require('path');\nconst m = require('./tableau-commun.cjs');\nconst [h] = m;\nconst [haut] = require('./tableau-commun.cjs');\nconst { 0: zero } = require('./tableau-commun.cjs');\nmodule.exports = [join(__dirname, require('./tableau-commun.cjs')[0]), join(__dirname, haut), join(__dirname, m[0]), join(__dirname, h), join(__dirname, zero), join(__dirname, require('./objet-a-cle-numerique.cjs')[0])];\n",
    ['mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .', 'mène à .'],
  ],
  'test/helpers/nom-numerique-lecteur.ts': [
    "import { join } from 'node:path';\nimport * as ns from './nom-numerique';\nconst { 0: z } = ns;\nexport const R = [join(__dirname, ns[0]), join(__dirname, z)];\n",
    ['mène à .', 'mène à .'],
  ],
  'test/helpers/classes-statiques.ts': [
    "import { dirname, join } from 'node:path';\nimport Defaut from './classe-defaut';\nclass Base {\n  static readonly ICI = join(__dirname, '..');\n}\nclass Fille extends Base {}\nclass PetiteFille extends Fille {}\nclass Soi {\n  static readonly ICI = join(__dirname, '..');\n  static readonly HAUT = dirname(this.ICI);\n  static readonly FLECHE = () => dirname(this.ICI);\n  static haut() {\n    return dirname(this.ICI);\n  }\n  static {\n    dirname(this.ICI);\n  }\n}\nexport const R = [dirname(Fille.ICI), dirname(PetiteFille.ICI), dirname(Defaut.ICI)];\n",
    [
      'mène à .',
      'mène à .',
      'mène à .',
      'mène à .',
      'mène à .',
      'mène à .',
      'mène à .',
    ],
  ],
};

const CHEMINS_DANS_LEUR_DOSSIER = {
  'src/a/b/c/au-niveau-de-src.spec.ts':
    "import { join } from 'node:path';\nexport const S = join(__dirname, '../../..');\n",
  'src/database/migrations.ts':
    "export const M = __dirname + '/../migrations/x.ts';\n",
  'test/helpers/ici.ts':
    "import { join } from 'node:path';\nexport const ICI = join(__dirname, '..');\n",
  'test/helpers/gabarit-interpole.ts':
    "import { join } from 'node:path';\nexport const F = (p: string) => join(__dirname, `../fixtures/${p}.json`);\n",
  'test/helpers/resolve-ancre.ts':
    "import { resolve } from 'node:path';\nexport const F = resolve(__dirname, '../fixtures');\n",
  'test/helpers/alias-sur.ts':
    "import { join as joindre } from 'node:path';\nexport const F = joindre(__dirname, 'x');\n",
  'test/helpers/defaut-sur.ts':
    "import path from 'node:path';\nexport const F = path.join(__dirname, 'x');\n",
  'scripts/require-sur.cjs':
    "const path = require('path');\nmodule.exports = { F: path.join(__dirname, 'x') };\n",
  'src/parametre.ts':
    "import { dirname, join } from 'node:path';\nexport const L = (nom: string) => dirname(join(__dirname, nom));\n",
  'test/helpers/racine-importee.ts':
    "import { readFileSync } from 'node:fs';\nimport { join, resolve } from 'node:path';\nimport { execSync } from 'node:child_process';\nimport { RACINE } from './racine';\nexport const D = readFileSync(join(RACINE, 'docs/x.md'));\nexport const S = resolve(RACINE, 'src');\nexport const L = execSync('git log -1', { cwd: RACINE });\n",
  'test/helpers/code-cite.ts':
    "export const SONDE = 'process.cwd() ; import.meta.url ; __dirname';\n",
  'test/helpers/promesse.ts':
    "import { resolve } from 'node:path';\nexport const R = resolve(__dirname, 'x');\nexport const P = new Promise<string>((resolve) => resolve('.'));\n",
  'test/helpers/absolu.ts':
    "import { readFileSync } from 'node:fs';\nimport { resolve } from 'node:path';\nexport const P = readFileSync('/etc/hosts', 'utf8');\nexport const H = resolve('/etc', 'hosts');\n",
  'test/helpers/environnement.ts':
    'export const U = process.env.DATABASE_URL;\n',
  'test/helpers/propriete-homonyme.ts':
    'export const F = (o: { __filename: string; __dirname: string }) => ({ __filename: o.__filename, __dirname: o.__dirname });\nexport const G = ({ __filename: f }: { __filename: string }) => f;\n',
  'test/helpers/new-target.ts':
    "export class C {\n  constructor() {\n    if (!new.target) throw new Error('new');\n  }\n}\n",
  'test/helpers/cycle.ts':
    'const A: string = B;\nconst B: string = A;\nexport const R = A;\n',
  'scripts/arguments.mjs': 'export const A = process.argv.slice(2);\n',
  'scripts/argv-destructure-sur.mjs':
    'const { argv } = process;\nexport const A = argv.slice(2);\n',
  'scripts/argv-importe-sur.mjs':
    "import { argv } from 'node:process';\nexport const A = argv.slice(2);\n",
  'scripts/exports.cjs': 'module.exports = { a: 1 };\n',
  'scripts/lib/ici.mjs': "export const ICI = 'lib';\n",
  'test/helpers/require-resolve-paquet.ts':
    "import { dirname } from 'node:path';\nexport const T = dirname(dirname(dirname(require.resolve('typescript'))));\n",
  'test/helpers/normalise.ts':
    "import { dirname, normalize } from 'node:path';\nexport const N = dirname(normalize(__dirname));\n",
  'test/helpers/tableau-de-module.ts':
    "import path from 'node:path';\nconst [resolve] = path as unknown as [typeof path.resolve];\nexport const R = resolve('.');\n",
  'test/helpers/liaison-imbriquee.ts':
    "import { resolve } from 'node:path';\nexport function f(o: { a: { resolve: (p: string) => string } }) {\n  const {\n    a: { resolve },\n  } = o;\n  return resolve('.');\n}\n",
  'src/sources-sonde.ts':
    "import { resolve } from 'node:path';\nexport const SOURCES = resolve(__dirname);\n",
  'test/helpers/fixtures-sonde.ts':
    "import { join } from 'node:path';\nexport const FIXTURES = join(__dirname, '..');\n",
  'test/helpers/haut-sonde.ts': "export const HAUT = '../..';\n",
  'test/helpers/reexport-nomme.ts': "export { HAUT } from './haut-sonde';\n",
  'test/helpers/reexport-renomme.ts':
    "export { HAUT as MONTEE } from './haut-sonde';\n",
  'test/helpers/reexport-tout.ts': "export * from './haut-sonde';\n",
  'test/helpers/haut-dossier/index.ts': "export const HAUT = '../..';\n",
  'test/helpers/haut-defaut.ts': "export default '../..';\n",
  'test/helpers/relais-espace.ts': "export * as H from './haut-sonde';\n",
  'scripts/nom-sonde.mjs': "export const NOM = 'package.json';\n",
  'test/helpers/litteral-sur.ts':
    "import { dirname, join } from 'node:path';\nconst O = { ici: join(__dirname, 'x'), ...{ la: join(__dirname, 'y') } };\nconst A = [join(__dirname, 'x')];\nexport const R = [dirname(O.ici), dirname(O.la), dirname(A[0])];\n",
  'test/helpers/ts-sys-sur.ts':
    "import ts from 'typescript';\nimport { join } from 'node:path';\nimport { RACINE } from './racine';\nexport const R = [ts.sys.readFile(join(RACINE, 'tsconfig.json')), ts.sys.write('texte')];\n",
  'test/helpers/argv-au-dela.ts':
    'const { argv: [, , premier] } = process;\nconst { argv: [, , ...[second]] } = process;\nconst { argv: [, , ...args] } = process;\nexport const A = [premier, second, args];\n',
  'test/helpers/export-local-renomme.ts':
    "const HAUT = '../..';\nexport { HAUT as LOCAL };\n",
  'test/helpers/cycle-a.ts': "export * from './cycle-b';\n",
  'test/helpers/cycle-b.ts': "export * from './cycle-a';\n",
  'test/helpers/via-cycle.ts':
    "import { join } from 'node:path';\nimport { X } from './cycle-a';\nexport const R = join(__dirname, X);\n",
  'scripts/argv-reste-calcule.mjs':
    'const { argv: [, , ...reste] } = process;\nconst [...copie] = reste;\nconst { argv: [, , ...[...encore]] } = process;\nconst { argv: { [2]: troisieme } } = process;\nexport const f = (k) => {\n  const { [k]: x } = reste;\n  return x;\n};\nexport const R = [copie, encore, troisieme];\n',
  'test/helpers/tableau-de-fichiers.ts':
    "import fs from 'node:fs';\nimport path from 'node:path';\nconst [lire] = fs as unknown as [typeof fs.readFileSync];\nconst { 0: premier } = fs as unknown as { 0: typeof fs.readFileSync };\nconst { [0]: calcule } = fs as unknown as { 0: typeof fs.readFileSync };\nconst { 'join': joindre } = path;\nexport const L = [lire('x'), premier('x'), calcule('x')];\nexport const J = joindre('a', 'b');\n",
  'test/helpers/racine-derivee.ts':
    "import { dirname, join, resolve } from 'node:path';\nimport { RACINE } from './racine';\nconst DOCS = join(RACINE, 'docs');\nexport const J = join(DOCS, '../package.json');\nexport const R = join(resolve(DOCS, 'x'), '..');\nexport const D = join(dirname(DOCS), 'src');\nexport const C = join(`${DOCS}/x`, '..');\n",
  'scripts/haut-commun.cjs':
    "module.exports = { HAUT: '..' };\nmodule.exports.BAS = '..';\n",
  'scripts/haut-entier.cjs': "module.exports = '..';\n",
  'scripts/haut-exports.cjs': "exports.EXPORTE = '..';\n",
  'test/helpers/etalement-cycle-a.ts':
    "import { join } from 'node:path';\nimport { P } from './etalement-cycle-b';\nexport const O: Record<string, string> = { ...P, a: join(__dirname, '..') };\n",
  'test/helpers/etalement-cycle-b.ts':
    "import { O } from './etalement-cycle-a';\nexport const P: Record<string, string> = { ...O, b: 'b' };\n",
  'test/helpers/etalement-cycle-lecteur.ts':
    "import { O } from './etalement-cycle-a';\nexport const R = O.toString();\n",
  'test/helpers/litteraux-formes-sur.ts':
    "import { dirname, join } from 'node:path';\nconst PREMIERE = { ...{ ici: join(__dirname, '..') }, ici: join(__dirname, 'x') };\nconst T = [...['a', 'b'], join(__dirname, '..')] as const;\nexport const f = (inconnus: string[]) => {\n  const U = [...inconnus, join(__dirname, '..')];\n  return dirname(U[1]);\n};\nexport const R = [dirname(PREMIERE.ici), dirname(T[1])];\n",
  'test/helpers/etalement-tableau-cycle.ts':
    "import { readFileSync } from 'node:fs';\nconst A: string[] = [...B];\nconst B: string[] = [...A];\nexport const R = readFileSync(...A);\n",
  'test/helpers/constantes-nommees-sur.ts':
    "import { dirname, join } from 'node:path';\nclass Instances {\n  readonly LA = join(__dirname, '..');\n}\nexport const R = dirname(Instances.LA);\n",
  'test/helpers/ts-config-sur.ts':
    "import ts from 'typescript';\nimport { join } from 'node:path';\nimport { RACINE } from './racine';\nexport const R = ts.readConfigFile(join(RACINE, 'tsconfig.json'), ts.sys.readFile);\n",
  'scripts/chemin-commun.cjs':
    "const { join } = require('path');\nmodule.exports = join(__dirname, 'x');\n",
  'test/helpers/haut-module.mts': "export const HAUT = '../..';\n",
  'test/helpers/haut-commun-type.cts': "export const HAUT = '../..';\n",
  'test/helpers/haut-vue.tsx': "export const HAUT = '../..';\n",
  'scripts/etalement-commun-cycle-a.cjs':
    "module.exports = { ...require('./etalement-commun-cycle-b.cjs'), a: 1 };\n",
  'scripts/etalement-commun-cycle-b.cjs':
    "module.exports = { ...require('./etalement-commun-cycle-a.cjs'), HAUT: '..' };\n",
  'scripts/cycle-entier-a.cjs':
    "module.exports = require('./cycle-entier-b.cjs');\n",
  'scripts/cycle-entier-b.cjs':
    "module.exports = require('./cycle-entier-a.cjs');\n",
  'scripts/cycle-liaison-a.cjs':
    "const { X } = require('./cycle-liaison-b.cjs');\nmodule.exports = { X };\n",
  'scripts/cycle-liaison-b.cjs':
    "const { X } = require('./cycle-liaison-a.cjs');\nmodule.exports = { X };\n",
  'test/helpers/cycle-nomme-a.ts': "export { X } from './cycle-nomme-b';\n",
  'test/helpers/cycle-nomme-b.ts': "export { X } from './cycle-nomme-a';\n",
  'test/helpers/cycle-importe-a.ts':
    "import { Y } from './cycle-importe-b';\nexport { Y };\n",
  'test/helpers/cycle-importe-b.ts':
    "import { Y } from './cycle-importe-a';\nexport { Y };\n",
  'scripts/ordre-a.cjs':
    "module.exports = { HAUT: '..', ...require('./ordre-b.cjs') };\n",
  'scripts/ordre-b.cjs': "module.exports = { ...require('./ordre-a.cjs') };\n",
  'scripts/croise-a.cjs':
    "module.exports = { HAUT: 'x', ...require('./croise-b.cjs') };\n",
  'scripts/croise-b.cjs':
    "module.exports = { HAUT: '..', ...require('./croise-a.cjs') };\n",
  'scripts/croise-par-b.cjs':
    "const { join } = require('path');\nmodule.exports = join(__dirname, require('./croise-b.cjs').HAUT);\n",
  'scripts/relue-a.cjs':
    "module.exports = { HAUT: '..', ...require('./relue-b.cjs') };\n",
  'scripts/relue-b.cjs':
    "module.exports = { HAUT: require('./relue-a.cjs').HAUT };\n",
  'scripts/tableau-commun.cjs': "module.exports = ['..'];\n",
  'scripts/objet-a-cle-numerique.cjs': "module.exports = { 0: '..' };\n",
  'test/helpers/nom-numerique.ts': "const h = '../..';\nexport { h as '0' };\n",
  'scripts/chaine-0.cjs':
    "module.exports = { ...require('./chaine-1.cjs'), ...require('./chaine-1.cjs') };\n",
  'scripts/chaine-1.cjs':
    "module.exports = { ...require('./chaine-2.cjs'), ...require('./chaine-2.cjs') };\n",
  'scripts/chaine-2.cjs':
    "module.exports = { ...require('./chaine-0.cjs') };\n",
  'scripts/chaine-lecteur.cjs':
    "module.exports = require('./chaine-0.cjs').absente;\n",
  'test/helpers/classe-defaut.ts':
    "import { join } from 'node:path';\nexport class Premiere {\n  static readonly ICI = join(__dirname, 'x');\n}\nexport default class Chemins {\n  static readonly ICI = join(__dirname, '..');\n}\n",
  'test/helpers/classes-statiques-sur.ts':
    "import { dirname, join } from 'node:path';\nclass Base {\n  static readonly ICI = join(__dirname, 'x');\n}\nclass Fille extends Base {\n  static readonly ICI = join(__dirname, '..');\n  readonly la = dirname(this.ICI);\n  f() {\n    return dirname(this.ICI);\n  }\n  static g() {\n    return function () {\n      return dirname(this.ICI);\n    };\n  }\n}\nexport const R = [dirname(Base.ICI)];\n",
};

function estUneSource(nom) {
  return /\.(?:[cm]?[jt]s|[jt]sx)$/.test(nom);
}

function sourcesDe(dossier) {
  return readdirSync(join(RACINE, dossier), {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entree) => entree.isFile() && estUneSource(entree.name))
    .map((entree) => relative(RACINE, join(entree.parentPath, entree.name)));
}

function lireSurDisque(fichier) {
  try {
    return readFileSync(join(RACINE, fichier), 'utf8');
  } catch {
    return undefined;
  }
}

function sansEnveloppe(noeud) {
  let courant = noeud;
  while (
    ts.isParenthesizedExpression(courant) ||
    ts.isAsExpression(courant) ||
    ts.isSatisfiesExpression(courant) ||
    ts.isNonNullExpression(courant) ||
    ts.isTypeAssertionExpression(courant)
  ) {
    courant = courant.expression;
  }
  return courant;
}

function parentHorsEnveloppe(noeud) {
  let courant = noeud;
  while (sansEnveloppe(courant.parent) !== courant.parent) {
    courant = courant.parent;
  }
  return courant.parent;
}

function dossierDe(noeud) {
  return dirname(join(RACINE, noeud.getSourceFile().fileName));
}

function lienDans(liaison, nom) {
  if (ts.isIdentifier(liaison)) {
    return liaison.text === nom ? { chemin: [] } : undefined;
  }
  for (const [rang, element] of liaison.elements.entries()) {
    if (ts.isOmittedExpression(element)) continue;
    const lien = lienDans(element.name, nom);
    if (!lien) continue;
    if (ts.isArrayBindingPattern(liaison)) {
      const cle = element.dotDotDotToken ? { depuis: rang } : rang;
      return { chemin: [cle, ...lien.chemin] };
    }
    if (element.dotDotDotToken) return lien;
    const cle = element.propertyName ?? element.name;
    return {
      chemin: [
        ts.isIdentifier(cle) ||
        ts.isStringLiteralLike(cle) ||
        ts.isNumericLiteral(cle)
          ? cleDeLiaison(cle.text)
          : { calculee: cle },
        ...lien.chemin,
      ],
    };
  }
  return undefined;
}

function cleDeLiaison(texte) {
  return /^(?:0|[1-9]\d*)$/.test(texte) ? Number(texte) : texte;
}

function declarationDansLeBloc(instructions, nom) {
  for (const instruction of instructions) {
    if (ts.isVariableStatement(instruction)) {
      for (const declaration of instruction.declarationList.declarations) {
        const lien = lienDans(declaration.name, nom);
        if (lien)
          return { genre: 'variable', declaration, chemin: lien.chemin };
      }
    }
    if (ts.isImportDeclaration(instruction) && instruction.importClause) {
      const module = instruction.moduleSpecifier.text;
      const { name, namedBindings } = instruction.importClause;
      const importe =
        name?.text === nom
          ? 'default'
          : namedBindings &&
              ts.isNamespaceImport(namedBindings) &&
              namedBindings.name.text === nom
            ? '*'
            : namedBindings && ts.isNamedImports(namedBindings)
              ? namedBindings.elements
                  .filter((element) => element.name.text === nom)
                  .map(
                    (element) => (element.propertyName ?? element.name).text,
                  )[0]
              : undefined;
      if (importe !== undefined) {
        return { genre: 'import', module, importe, declaration: instruction };
      }
    }
    if (
      ts.isImportEqualsDeclaration(instruction) &&
      instruction.name.text === nom
    ) {
      return { genre: 'import-egal', declaration: instruction };
    }
    if (
      (ts.isClassDeclaration(instruction) ||
        ts.isEnumDeclaration(instruction)) &&
      instruction.name?.text === nom
    ) {
      return { genre: 'expression', expression: instruction };
    }
  }
  return undefined;
}

function estModuleExports(noeud) {
  return (
    ts.isPropertyAccessExpression(noeud) &&
    ts.isIdentifier(noeud.expression) &&
    noeud.expression.text === 'module' &&
    noeud.name.text === 'exports'
  );
}

function exportCommun(arbre, nom) {
  for (const instruction of [...arbre.statements].reverse()) {
    const affectation =
      ts.isExpressionStatement(instruction) &&
      sansEnveloppe(instruction.expression);
    if (
      !affectation ||
      !ts.isBinaryExpression(affectation) ||
      affectation.operatorToken.kind !== ts.SyntaxKind.EqualsToken
    ) {
      continue;
    }
    const { left: cible, right: expression } = affectation;
    if (estModuleExports(cible)) {
      return nom === 'default'
        ? { genre: 'expression', expression }
        : { genre: 'membre', expression, nom };
    }
    if (
      ts.isPropertyAccessExpression(cible) &&
      cible.name.text === nom &&
      (estModuleExports(cible.expression) ||
        (ts.isIdentifier(cible.expression) &&
          cible.expression.text === 'exports'))
    ) {
      return { genre: 'expression', expression };
    }
  }
  return undefined;
}

function paquetDe(specificateur) {
  return /^((?:@[\w.-]+\/)?[\w.-]+)\/\S*$/.exec(specificateur)?.[1];
}

function declarationDe(identifiant) {
  const nom = identifiant.text;
  for (let portee = identifiant.parent; portee; portee = portee.parent) {
    if (
      ts.isFunctionLike(portee) &&
      portee.parameters.some((parametre) => lienDans(parametre.name, nom))
    ) {
      return { genre: 'inconnu' };
    }
    if (ts.isSourceFile(portee) || ts.isBlock(portee)) {
      const trouvee = declarationDansLeBloc(portee.statements, nom);
      if (trouvee) return trouvee;
    }
  }
  return undefined;
}

function estUneReference(identifiant) {
  const parent = identifiant.parent;
  return !(
    ((ts.isPropertyAccessExpression(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isPropertySignature(parent)) &&
      parent.name === identifiant) ||
    ((ts.isBindingElement(parent) || ts.isImportSpecifier(parent)) &&
      (parent.name === identifiant || parent.propertyName === identifiant))
  );
}

function membre(objet, nom) {
  if (objet?.famille !== undefined && objet.rang === undefined) {
    if (nom === 'native') return objet;
    if (nom === 'call') return { ...objet, decalage: 1 };
    if (nom === 'apply') return { ...objet, applique: true };
    if (nom === 'bind') return { ...objet, lie: true, decalage: 1 };
  }
  if (objet?.module === undefined) return undefined;
  if (objet.module === 'global') {
    return GLOBALES.has(nom) ? { module: GLOBALES.get(nom) } : undefined;
  }
  if (nom === 'default' && FAMILLES_DE_MODULES.has(objet.module)) return objet;
  if (objet.module === 'typescript') {
    if (nom === 'sys') return { module: 'systeme-ts' };
    return CHEMINS_DE_TYPESCRIPT.has(nom)
      ? { famille: 'fichiers', membre: nom }
      : undefined;
  }
  if (objet.module === 'systeme-ts') {
    return CHEMINS_DE_TS_SYS.has(nom)
      ? { famille: 'fichiers', membre: nom }
      : undefined;
  }
  if (SOUS_MODULES.get(objet.module)?.has(nom)) return { module: objet.module };
  if (objet.module === 'chemin' && nom === 'sep') return { texte: '/' };
  return { famille: objet.module, membre: nom };
}

function concatener(parties) {
  let debut = 0;
  while (parties[debut]?.texte === '') debut += 1;
  const [premiere, ...suite] = parties.slice(debut);
  const queue = suite
    .map((partie) => partie?.texte ?? SEGMENT_INCONNU)
    .join('');
  if (premiere?.chemin !== undefined)
    return ancre(premiere, premiere.chemin + queue);
  if (premiere?.texte !== undefined) return { texte: premiere.texte + queue };
  return undefined;
}

function segmentDe(valeur) {
  return valeur?.texte ?? SEGMENT_INCONNU;
}

function ancre(origine, chemin) {
  return origine.proprietaire ? { chemin, proprietaire: true } : { chemin };
}

function elementDe(valeur, cle) {
  if (
    valeur?.famille !== 'processus' ||
    valeur.membre !== 'argv' ||
    valeur.rang !== undefined
  ) {
    return undefined;
  }
  const debut = valeur.debut ?? 0;
  if (typeof cle === 'number') return { ...valeur, rang: debut + cle };
  if (cle?.depuis !== undefined)
    return { ...valeur, debut: debut + cle.depuis };
  return cle === undefined ? { ...valeur, debut } : undefined;
}

function estArgv(valeur) {
  return (
    valeur?.famille === 'processus' &&
    valeur.membre === 'argv' &&
    valeur.rang === undefined &&
    valeur.debut === undefined
  );
}

function litLeScript(valeur) {
  return (
    valeur?.famille === 'processus' &&
    valeur.membre === 'argv' &&
    (valeur.rang ?? valeur.debut) < 2
  );
}

function estStatique(membreDeClasse) {
  return (
    ts.canHaveModifiers(membreDeClasse) &&
    (ts
      .getModifiers(membreDeClasse)
      ?.some(
        (modificateur) => modificateur.kind === ts.SyntaxKind.StaticKeyword,
      ) ??
      false)
  );
}

function classeDuThis(noeud) {
  const porteur = ts.findAncestor(
    noeud.parent,
    (ancetre) =>
      ts.isClassElement(ancetre) ||
      (ts.isFunctionLike(ancetre) && !ts.isArrowFunction(ancetre)),
  );
  return porteur !== undefined &&
    ts.isClassLike(porteur.parent) &&
    (ts.isClassStaticBlockDeclaration(porteur) || estStatique(porteur))
    ? { litteral: porteur.parent }
    : undefined;
}

function analyseurDeRacine(lire, quandCalcule = () => {}) {
  const arbres = new Map();
  const valeurs = new Map();
  const membres = new Map();
  const exportees = new Map();

  const EN_COURS = Symbol('en cours');

  const memoriser = (table, cle, calcul) => {
    if (table.has(cle)) {
      const connue = table.get(cle);
      return connue === EN_COURS ? undefined : connue;
    }
    quandCalcule(table, cle);
    table.set(cle, EN_COURS);
    const valeur = calcul();
    table.set(cle, valeur);
    return valeur;
  };

  const sousTable = (tables, cle) => {
    if (!tables.has(cle)) tables.set(cle, new Map());
    return tables.get(cle);
  };

  const arbreDe = (fichier) => {
    if (!arbres.has(fichier)) {
      const texte = lire(fichier);
      arbres.set(
        fichier,
        texte === undefined
          ? undefined
          : ts.createSourceFile(fichier, texte, ts.ScriptTarget.Latest, true),
      );
    }
    return arbres.get(fichier);
  };

  const fichierImporte = (fichier, specificateur) => {
    const base = join(dirname(fichier), specificateur);
    return [
      base,
      base.replace(/\.([cm]?)js(x?)$/, '.$1ts$2'),
      ...EXTENSIONS_IMPORTABLES.map((extension) => base + extension),
      ...EXTENSIONS_IMPORTABLES.map((extension) =>
        join(base, `index${extension}`),
      ),
    ].find((candidat) => arbreDe(candidat) !== undefined);
  };

  const exporteeDe = (fichier, nom, vus = new Set()) => {
    const arbre = arbreDe(fichier);
    if (arbre === undefined || vus.has(fichier)) return undefined;
    vus.add(fichier);
    for (const instruction of arbre.statements) {
      if (nom === 'default' && ts.isExportAssignment(instruction)) {
        return { genre: 'expression', expression: instruction.expression };
      }
      if (
        nom === 'default' &&
        ts.isClassDeclaration(instruction) &&
        ts
          .getModifiers(instruction)
          ?.some(
            (modificateur) =>
              modificateur.kind === ts.SyntaxKind.DefaultKeyword,
          )
      ) {
        return { genre: 'expression', expression: instruction };
      }
      if (!ts.isExportDeclaration(instruction)) continue;
      const module = instruction.moduleSpecifier?.text;
      const clause = instruction.exportClause;
      if (
        clause !== undefined &&
        ts.isNamespaceExport(clause) &&
        clause.name.text === nom
      ) {
        return {
          genre: 'import',
          module,
          importe: '*',
          declaration: instruction,
        };
      }
      if (clause === undefined && module !== undefined) {
        const cible = fichierImporte(fichier, module);
        const trouvee = cible && exporteeDe(cible, nom, vus);
        if (trouvee) return trouvee;
        continue;
      }
      const element =
        clause &&
        ts.isNamedExports(clause) &&
        clause.elements.find((candidat) => candidat.name.text === nom);
      if (!element) continue;
      const importe = (element.propertyName ?? element.name).text;
      if (module !== undefined) {
        return { genre: 'import', module, importe, declaration: instruction };
      }
      if (importe !== nom) {
        return declarationDansLeBloc(arbre.statements, importe);
      }
    }
    return (
      declarationDansLeBloc(arbre.statements, nom) ?? exportCommun(arbre, nom)
    );
  };

  const valeurDeLaDeclaration = (trouvee) => {
    if (trouvee.genre === 'expression') return evaluer(trouvee.expression);
    if (trouvee.genre === 'membre') {
      return membreDe(evaluer(trouvee.expression), trouvee.nom);
    }
    if (trouvee.genre === 'variable') {
      const { declaration, chemin } = trouvee;
      let valeur = declaration.initializer && evaluer(declaration.initializer);
      for (const cle of chemin) {
        const nom = cle?.calculee === undefined ? cle : cleCalculee(cle);
        valeur =
          elementDe(valeur, nom) ??
          (typeof nom === 'string' ||
          nom === undefined ||
          valeur?.litteral !== undefined ||
          (valeur?.espace !== undefined && typeof nom === 'number')
            ? membreDe(valeur, nom)
            : undefined);
      }
      return valeur?.chemin !== undefined &&
        PROPRIETAIRES_DE_LA_RACINE.has(declaration.getSourceFile().fileName)
        ? { chemin: valeur.chemin, proprietaire: true }
        : valeur;
    }
    if (trouvee.genre === 'import-egal') {
      const reference = trouvee.declaration.moduleReference;
      const famille =
        ts.isExternalModuleReference(reference) &&
        ts.isStringLiteralLike(reference.expression)
          ? MODULES.get(reference.expression.text)
          : undefined;
      return famille && { module: famille };
    }
    if (trouvee.genre !== 'import') return undefined;
    const famille = MODULES.get(trouvee.module);
    const entier = trouvee.importe === 'default' || trouvee.importe === '*';
    if (famille) {
      return entier
        ? { module: famille }
        : membre({ module: famille }, trouvee.importe);
    }
    const cible = fichierImporte(
      trouvee.declaration.getSourceFile().fileName,
      trouvee.module,
    );
    if (cible === undefined) return undefined;
    if (trouvee.importe === '*') return { espace: cible };
    return valeurExportee(cible, trouvee.importe);
  };

  const valeurExportee = (fichier, nom) =>
    memoriser(sousTable(exportees, fichier), nom, () => {
      const exportee = exporteeDe(fichier, nom);
      return exportee && valeurDeLaDeclaration(exportee);
    });

  const membreDuLitteral = (litteral, nom) => {
    if (nom === undefined || typeof nom === 'object') return undefined;
    const cle = cleDeLiaison(String(nom));
    return memoriser(sousTable(membres, litteral), cle, () =>
      calculerLeMembre(litteral, nom, cle),
    );
  };

  const calculerLeMembre = (litteral, nom, cle) => {
    if (ts.isArrayLiteralExpression(litteral)) {
      const avant = deplier(litteral.elements).slice(0, Number(cle) + 1);
      return typeof cle !== 'number' ||
        avant.length <= cle ||
        avant.some(ts.isSpreadElement)
        ? undefined
        : evaluer(avant[cle]);
    }
    const proprietes = ts.isClassLike(litteral)
      ? litteral.members.filter(
          (membreDeClasse) =>
            ts.isPropertyDeclaration(membreDeClasse) &&
            estStatique(membreDeClasse),
        )
      : ts.isEnumDeclaration(litteral)
        ? litteral.members
        : litteral.properties;
    for (const propriete of [...proprietes].reverse()) {
      if (ts.isSpreadAssignment(propriete)) {
        const valeur = membreDe(evaluer(propriete.expression), nom);
        if (valeur !== undefined) return valeur;
        continue;
      }
      const nomDeLaPropriete = ts.isComputedPropertyName(propriete.name)
        ? cleCalculee({ calculee: propriete.name })
        : cleDeLiaison(propriete.name.text);
      if (nomDeLaPropriete !== cle) continue;
      if (ts.isPropertyAssignment(propriete)) {
        return evaluer(propriete.initializer);
      }
      if (ts.isShorthandPropertyAssignment(propriete)) {
        return valeurDuNom(propriete.name);
      }
      return (ts.isPropertyDeclaration(propriete) ||
        ts.isEnumMember(propriete)) &&
        propriete.initializer
        ? evaluer(propriete.initializer)
        : undefined;
    }
    const parente =
      ts.isClassLike(litteral) &&
      litteral.heritageClauses?.find(
        (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
      )?.types[0]?.expression;
    return parente ? membreDe(evaluer(parente), nom) : undefined;
  };

  const elementsDuTableau = (noeud, vus = new Set()) => {
    const litteral = noeud && evaluer(noeud)?.litteral;
    return litteral &&
      ts.isArrayLiteralExpression(litteral) &&
      !vus.has(litteral)
      ? deplier(litteral.elements, new Set(vus).add(litteral))
      : undefined;
  };

  const deplier = (noeuds, vus = new Set()) =>
    noeuds.flatMap(
      (noeud) =>
        (ts.isSpreadElement(noeud) &&
          elementsDuTableau(noeud.expression, vus)) || [noeud],
    );

  const membreDe = (objet, nom) => {
    if (objet?.litteral !== undefined) {
      return membreDuLitteral(objet.litteral, nom);
    }
    if (objet?.espace === undefined) return membre(objet, nom);
    return nom === undefined
      ? undefined
      : valeurExportee(objet.espace, String(nom));
  };

  const cleCalculee = ({ calculee }) => {
    if (!ts.isComputedPropertyName(calculee)) return undefined;
    const expression = sansEnveloppe(calculee.expression);
    const valeur = evaluer(expression);
    if (valeur?.nombre !== undefined) return valeur.nombre;
    return valeur?.texte === undefined ? undefined : cleDeLiaison(valeur.texte);
  };

  const valeurDuNom = (identifiant) => {
    const trouvee = declarationDe(identifiant);
    if (trouvee) return valeurDeLaDeclaration(trouvee);
    if (identifiant.text === '__dirname')
      return { chemin: dossierDe(identifiant) };
    const globale = GLOBALES.get(identifiant.text);
    return globale && { module: globale };
  };

  const appelReel = (appel) => {
    const fonction =
      appel.expression.kind === ts.SyntaxKind.ImportKeyword
        ? { module: 'require' }
        : evaluer(appel.expression);
    const donnes = deplier(appel.arguments);
    if (fonction?.famille === 'reflet' && fonction.membre === 'apply') {
      const [cible, , liste] = donnes;
      const appelee = cible && evaluer(cible);
      return {
        fonction: appelee,
        arguments: [
          ...(appelee?.prefixe ?? []),
          ...(elementsDuTableau(liste) ?? []),
        ],
      };
    }
    const propres = fonction?.applique
      ? (elementsDuTableau(donnes[1]) ?? [])
      : donnes.slice(fonction?.decalage ?? 0);
    return {
      fonction,
      arguments: [...(fonction?.prefixe ?? []), ...propres],
    };
  };

  const valeurDuRequire = (appel, cible) => {
    if (appel.expression.kind === ts.SyntaxKind.ImportKeyword) {
      return { espace: cible };
    }
    const entier = exportCommun(arbreDe(cible), 'default');
    const valeur = entier && evaluer(entier.expression);
    return valeur?.texte !== undefined || valeur?.chemin !== undefined
      ? valeur
      : { espace: cible };
  };

  const valeurDeLAppel = (appel) => {
    const { fonction, arguments: argumentsReels } = appelReel(appel);
    if (fonction?.lie) {
      return {
        ...fonction,
        lie: false,
        decalage: 0,
        prefixe: argumentsReels,
      };
    }
    const valeursDesArguments = argumentsReels.map(evaluer);
    const [premier] = valeursDesArguments;
    if (fonction?.module === 'require') {
      const famille = MODULES.get(premier?.texte);
      if (famille) return { module: famille };
      const cible =
        premier?.texte?.startsWith('.') &&
        fichierImporte(appel.getSourceFile().fileName, premier.texte);
      return cible ? valeurDuRequire(appel, cible) : undefined;
    }
    if (fonction?.famille === 'require' && fonction.membre === 'resolve') {
      return premier?.texte?.startsWith('.')
        ? { chemin: join(dossierDe(appel), premier.texte) }
        : undefined;
    }
    if (fonction?.famille !== 'chemin') return undefined;
    if (fonction.membre === 'join') {
      const suite = valeursDesArguments.slice(1).map(segmentDe);
      if (premier?.chemin !== undefined)
        return ancre(premier, join(premier.chemin, ...suite));
      if (premier?.texte !== undefined)
        return { texte: join(premier.texte, ...suite) };
      return undefined;
    }
    if (fonction.membre === 'resolve' || fonction.membre === undefined) {
      const rangDeLAncre = valeursDesArguments.findLastIndex(
        (valeur) => valeur?.texte === undefined || valeur.texte.startsWith('/'),
      );
      if (rangDeLAncre === -1) return { relatif: true };
      const base = valeursDesArguments[rangDeLAncre];
      return base?.chemin === undefined
        ? undefined
        : ancre(
            base,
            resolve(
              base.chemin,
              ...valeursDesArguments
                .slice(rangDeLAncre + 1)
                .map((valeur) => valeur.texte),
            ),
          );
    }
    if (fonction.membre === 'dirname' || fonction.membre === 'normalize') {
      const calcul = fonction.membre === 'dirname' ? dirname : normalize;
      if (premier?.chemin !== undefined) {
        return ancre(premier, calcul(resolve(premier.chemin)));
      }
      return premier?.texte === undefined
        ? undefined
        : { texte: calcul(premier.texte) };
    }
    return undefined;
  };

  const calculer = (noeud) => {
    if (ts.isStringLiteralLike(noeud)) return { texte: noeud.text };
    if (ts.isTemplateExpression(noeud)) {
      return concatener([
        { texte: noeud.head.text },
        ...noeud.templateSpans.flatMap((portion) => [
          evaluer(portion.expression),
          { texte: portion.literal.text },
        ]),
      ]);
    }
    if (
      ts.isBinaryExpression(noeud) &&
      noeud.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return concatener([evaluer(noeud.left), evaluer(noeud.right)]);
    }
    if (ts.isIdentifier(noeud)) return valeurDuNom(noeud);
    if (noeud.kind === ts.SyntaxKind.ThisKeyword) return classeDuThis(noeud);
    if (ts.isAwaitExpression(noeud)) return evaluer(noeud.expression);
    if (ts.isPropertyAccessExpression(noeud)) {
      return membreDe(evaluer(noeud.expression), noeud.name.text);
    }
    if (ts.isElementAccessExpression(noeud)) {
      const objet = evaluer(noeud.expression);
      const cle = evaluer(noeud.argumentExpression);
      return membreDe(
        objet,
        (objet?.litteral || objet?.espace) && cle?.nombre !== undefined
          ? String(cle.nombre)
          : cle?.texte,
      );
    }
    if (ts.isNumericLiteral(noeud)) return { nombre: Number(noeud.text) };
    if (
      ts.isObjectLiteralExpression(noeud) ||
      ts.isArrayLiteralExpression(noeud) ||
      ts.isClassLike(noeud) ||
      ts.isEnumDeclaration(noeud)
    ) {
      return { litteral: noeud };
    }
    return ts.isCallExpression(noeud) ? valeurDeLAppel(noeud) : undefined;
  };

  function evaluer(noeud) {
    const cible = sansEnveloppe(noeud);
    return memoriser(valeurs, cible, () => calculer(cible));
  }

  const estArgvAuDelaDuScript = (noeud) => {
    const parent = parentHorsEnveloppe(noeud);
    const appel = parent.parent;
    const [debut] = ts.isCallExpression(appel) ? appel.arguments : [];
    return (
      ts.isPropertyAccessExpression(parent) &&
      parent.name.text === 'slice' &&
      debut !== undefined &&
      ts.isNumericLiteral(debut) &&
      Number(debut.text) >= 2
    );
  };

  const estDansUnCalculDeChemin = (identifiant) => {
    const parent = parentHorsEnveloppe(identifiant);
    if (
      (ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
      ts.isTemplateSpan(parent)
    ) {
      return true;
    }
    const fonction = ts.isCallExpression(parent) && evaluer(parent.expression);
    return (
      fonction?.famille === 'chemin' && CALCULS_DE_CHEMIN.has(fonction.membre)
    );
  };

  const reglesDuTexte = (litteral) => {
    const regles = [];
    if (NOMS_SUSPECTS.has(litteral.text)) {
      regles.push(NOMS_SUSPECTS.get(litteral.text));
    }
    const paquet = paquetDe(litteral.text);
    if (MODULES_D_EMPLACEMENT.has(paquet)) {
      regles.push(NOMS_SUSPECTS.get(paquet));
    }
    const git = RACINE_PAR_GIT.exec(litteral.text);
    if (git) regles.push(`git rev-parse ${git[0]}`);
    return regles;
  };

  const reglesDeLIdentifiant = (identifiant) => {
    const parent = identifiant.parent;
    if (
      NOMS_SUSPECTS.has(identifiant.text) &&
      ((ts.isPropertyAccessExpression(parent) && parent.name === identifiant) ||
        ((ts.isBindingElement(parent) ||
          ts.isImportSpecifier(parent) ||
          ts.isExportSpecifier(parent)) &&
          (parent.propertyName ?? parent.name) === identifiant))
    ) {
      return [NOMS_SUSPECTS.get(identifiant.text)];
    }
    if (ts.isBindingElement(parent) && parent.name === identifiant) {
      const trouvee = declarationDe(identifiant);
      return trouvee?.genre === 'variable' &&
        litLeScript(valeurDeLaDeclaration(trouvee)) &&
        !estArgv(
          trouvee.declaration.initializer &&
            evaluer(trouvee.declaration.initializer),
        )
        ? ['process.argv hors de slice(2)']
        : [];
    }
    if (!estUneReference(identifiant)) return [];
    if (declarationDe(identifiant)) {
      return estArgv(evaluer(identifiant)) &&
        !estArgvAuDelaDuScript(identifiant)
        ? ['process.argv hors de slice(2)']
        : [];
    }
    if (identifiant.text === '__filename') return ['__filename'];
    if (
      identifiant.text === '__dirname' &&
      !estDansUnCalculDeChemin(identifiant)
    ) {
      return ['__dirname hors d un calcul de chemin'];
    }
    return [];
  };

  const reglesDeLAcces = (acces) => {
    const objet = evaluer(acces.expression);
    const cle = ts.isElementAccessExpression(acces)
      ? sansEnveloppe(acces.argumentExpression)
      : undefined;
    const nom = cle ? evaluer(cle)?.texte : acces.name.text;
    if (cle && !ts.isStringLiteralLike(cle) && NOMS_SUSPECTS.has(nom)) {
      return [NOMS_SUSPECTS.get(nom)];
    }
    if (objet?.module === 'require' && nom === 'main') return ['require.main'];
    if (
      objet?.famille === 'require' &&
      objet.membre === 'resolve' &&
      nom === 'paths'
    ) {
      return ['require.resolve.paths'];
    }
    if (objet?.module === 'module' && nom !== 'exports') {
      return [`module.${nom}`];
    }
    return estArgv(membreDe(objet, nom)) && !estArgvAuDelaDuScript(acces)
      ? ['process.argv hors de slice(2)']
      : [];
  };

  const reglesDeLAppel = (appel) => {
    const { fonction, arguments: argumentsReels } = appelReel(appel);
    if (fonction?.famille === 'chemin' && evaluer(appel)?.relatif) {
      return ['resolve depuis le répertoire courant'];
    }
    const rangs =
      fonction?.famille === 'fichiers'
        ? FONCTIONS_A_DEUX_CHEMINS.has(fonction.membre)
          ? [0, 1]
          : [0]
        : fonction?.famille === 'adresse' && fonction.membre === 'pathToFileURL'
          ? [0]
          : [];
    return rangs.some((rang) => {
      const argument = argumentsReels[rang];
      const valeur = argument && evaluer(argument);
      return valeur?.texte !== undefined && !valeur.texte.startsWith('/');
    })
      ? [`${fonction.membre ?? '[clé calculée]'} depuis le répertoire courant`]
      : [];
  };

  const reglesDeSortie = (noeud) => {
    const tete = join(RACINE, noeud.getSourceFile().fileName.split('/')[0]);
    const valeur = evaluer(noeud);
    if (valeur?.chemin === undefined || valeur.proprietaire) return [];
    const cible = resolve(valeur.chemin);
    return cible === tete || cible.startsWith(tete + sep)
      ? []
      : [`mène à ${relative(RACINE, cible) || '.'}`];
  };

  const reglesDuNoeud = (noeud) => {
    if (
      ts.isMetaProperty(noeud) &&
      noeud.keywordToken === ts.SyntaxKind.ImportKeyword
    ) {
      return ['import.meta'];
    }
    if (ts.isStringLiteralLike(noeud)) return reglesDuTexte(noeud);
    if (ts.isIdentifier(noeud)) return reglesDeLIdentifiant(noeud);
    if (
      ts.isPropertyAccessExpression(noeud) ||
      ts.isElementAccessExpression(noeud)
    ) {
      return reglesDeLAcces(noeud);
    }
    if (ts.isCallExpression(noeud)) {
      return [...reglesDeLAppel(noeud), ...reglesDeSortie(noeud)];
    }
    return (ts.isBinaryExpression(noeud) &&
      noeud.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
      ts.isTemplateExpression(noeud)
      ? reglesDeSortie(noeud)
      : [];
  };

  return (fichier) => {
    for (const table of [valeurs, membres, exportees]) table.clear();
    const regles = [];
    const visiter = (noeud) => {
      regles.push(...reglesDuNoeud(noeud));
      ts.forEachChild(noeud, visiter);
    };
    visiter(arbreDe(fichier));
    return regles;
  };
}

function analyseurDesSondes(sondes, quandCalcule) {
  return analyseurDeRacine(
    (fichier) => sondes.get(fichier) ?? lireSurDisque(fichier),
    quandCalcule,
  );
}

const TEXTES_DES_SONDES = new Map([
  ...Object.entries(CALCULS_DE_RACINE).map(([fichier, [texte]]) => [
    fichier,
    texte,
  ]),
  ...Object.entries(CHEMINS_DANS_LEUR_DOSSIER),
]);

void test('aucun script ni test ne calcule la racine du dépôt hors de ses propriétaires', () => {
  const sources = ['scripts', 'src', 'test'].flatMap(sourcesDe);
  const calculsDeRacine = analyseurDeRacine(lireSurDisque);

  for (const temoin of [
    'scripts/lib/racine.mjs',
    'src/main.ts',
    'test/helpers/racine.ts',
  ]) {
    assert.ok(sources.includes(temoin), temoin);
  }
  assert.deepEqual(
    sources
      .filter((fichier) => !PROPRIETAIRES_DE_LA_RACINE.has(fichier))
      .flatMap((fichier) =>
        calculsDeRacine(fichier).map((regle) => `${fichier} : ${regle}`),
      ),
    [],
  );
});

void test('relève chaque calcul de la racine sous la règle qui le nomme', () => {
  const sondes = Object.entries(CALCULS_DE_RACINE);
  const calculsDeRacine = analyseurDesSondes(TEXTES_DES_SONDES);

  assert.deepEqual(
    Object.fromEntries(
      sondes.map(([fichier]) => [
        fichier,
        estUneSource(fichier) ? calculsDeRacine(fichier) : 'non lu',
      ]),
    ),
    Object.fromEntries(
      sondes.map(([fichier, [, regles]]) => [fichier, regles]),
    ),
  );
});

void test('juge chaque fichier comme s il était analysé seul, dans l ordre comme à rebours', () => {
  const fichiers = [...TEXTES_DES_SONDES.keys()].filter(estUneSource);
  const verdicts = (ordre, verdictDe) =>
    Object.fromEntries(ordre.map((fichier) => [fichier, verdictDe(fichier)]));
  const seuls = verdicts(fichiers, (fichier) =>
    analyseurDesSondes(TEXTES_DES_SONDES)(fichier),
  );

  assert.deepEqual(
    verdicts(fichiers, analyseurDesSondes(TEXTES_DES_SONDES)),
    seuls,
  );
  assert.deepEqual(
    verdicts([...fichiers].reverse(), analyseurDesSondes(TEXTES_DES_SONDES)),
    seuls,
  );
});

void test('calcule chaque valeur une seule fois par fichier analysé, cycles compris', () => {
  const recalcules = new Set();
  let calculees = new Map();
  let analyse;
  const analyser = analyseurDesSondes(TEXTES_DES_SONDES, (table, cle) => {
    const cles = calculees.get(table) ?? new Set();
    if (cles.has(cle)) recalcules.add(analyse);
    calculees.set(table, cles.add(cle));
  });

  for (const fichier of [...TEXTES_DES_SONDES.keys()].filter(estUneSource)) {
    analyse = fichier;
    calculees = new Map();
    analyser(fichier);
  }
  assert.deepEqual([...recalcules], []);
});

void test('laisse un chemin qui reste dans son dossier de tête, src compris', () => {
  const sondes = Object.entries(CHEMINS_DANS_LEUR_DOSSIER);
  const calculsDeRacine = analyseurDesSondes(new Map(sondes));

  assert.deepEqual(
    sondes.flatMap(([fichier]) =>
      calculsDeRacine(fichier).map((regle) => `${fichier} : ${regle}`),
    ),
    [],
  );
});

void test('la racine du dépôt existe sur disque sous un chemin à espace et accent', async () => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'racine-')));
  const depot = join(parent, 'dépôt à espace');
  const copie = join(depot, 'scripts', 'lib', 'racine.mjs');
  try {
    mkdirSync(join(depot, 'scripts', 'lib'), { recursive: true });
    cpSync(SOURCE, copie);

    const { RACINE } = await import(pathToFileURL(copie).href);

    assert.equal(existsSync(RACINE), true);
    assert.equal(resolve(RACINE), depot);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
