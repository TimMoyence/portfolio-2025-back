import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import {
  analyzeFile,
  collectFiles,
  formatGate,
  GATE,
  githubAnnotation,
  isInScope,
  isolatedGitEnv,
  parseArgs,
  ratchetCeiling,
  runGate,
  tightenCeiling,
} from './guard-no-comments.mjs';

/** @param {string[]} parts @returns {string} */
const L = (...parts) => parts.join('\n');

/**
 * @param {{ files?: Record<string, string>, ratchet?: { maxOffenses: unknown } }} input
 * @param {(root: string) => void} run
 * @returns {void}
 */
const withRepo = ({ files = {}, ratchet }, run) => {
  const root = mkdtempSync(join(tmpdir(), 'guard-no-comments-'));
  try {
    execFileSync('git', ['-C', root, 'init', '-q'], { env: isolatedGitEnv() });
    const manifest = {
      name: 'guard-fixture',
      ...(ratchet && { [GATE]: ratchet }),
    };
    writeFileSync(
      join(root, 'package.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(join(root, dirname(rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
    }
    execFileSync('git', ['-C', root, 'add', '-A'], { env: isolatedGitEnv() });
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

/** @param {string} gitDir @param {() => void} run @returns {void} */
const underInheritedGitDir = (gitDir, run) => {
  const inherited = process.env.GIT_DIR;
  process.env.GIT_DIR = gitDir;
  try {
    run();
  } finally {
    if (inherited === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = inherited;
  }
};

/** @param {string} repo @param {string[]} args @returns {string} */
const gitIn = (repo, args) =>
  execFileSync('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    env: isolatedGitEnv(),
  });

/** @param {string} root @returns {unknown} */
const declaredCeiling = (root) =>
  JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))[GATE];

/** @param {number} n @returns {string} */
const narrative = (n) =>
  L(
    ...Array.from({ length: n }, (_, i) => `// prose numero ${i}`),
    'const a = 1;',
  );

/** @param {string} text @param {string} [file] @returns {ReturnType<typeof analyzeFile>} */
const ts = (text, file = 'src/a.service.ts') => analyzeFile({ text, file });

/** @param {ReturnType<typeof analyzeFile>} offenders @returns {number[]} */
const linesOf = (offenders) => offenders.map((o) => o.line);

void test('contrat : toutes les fonctions du gate sont exportees', () => {
  for (const fn of [
    analyzeFile,
    collectFiles,
    formatGate,
    githubAnnotation,
    isInScope,
    parseArgs,
    ratchetCeiling,
    runGate,
    tightenCeiling,
  ]) {
    assert.equal(typeof fn, 'function');
  }
});

void test('prose narrative sans fait verifiable -> offense sur chaque ligne porteuse', () => {
  const off = ts(L('// on recupere le user', 'const user = load();'));
  assert.equal(off.length, 1);
  assert.deepEqual(linesOf(off), [1]);
  assert.equal(off[0].reason, 'commentaire narratif sans fait verifiable');
});

void test('JSDoc qui paraphrase la signature -> offense sur les lignes de prose', () => {
  const off = ts(
    L(
      '/**',
      ' * Cree un utilisateur.',
      ' */',
      'export function createUser() {}',
    ),
  );
  assert.deepEqual(linesOf(off), [2]);
});

void test('en `.ts` un @param est du bruit typant -> offense (les types portent deja l information)', () => {
  const off = ts(
    L(
      '/**',
      ' * @param id identifiant',
      ' */',
      'export function get(id: string) {}',
    ),
  );
  assert.deepEqual(linesOf(off), [2]);
});

void test('en `.mjs` le JSDoc typant est le seul typage disponible -> 0 offense', () => {
  const text = L(
    '/**',
    ' * @param {string} id',
    ' * @returns {number}',
    ' */',
    'export function get(id) {}',
  );
  assert.deepEqual(analyzeFile({ text, file: 'scripts/x.mjs' }), []);
});

void test('en `.mjs` la prose d entete d un JSDoc typant reste une offense', () => {
  const text = L(
    '/**',
    ' * Recupere la valeur.',
    ' * @param {string} id',
    ' */',
    'export function get(id) {}',
  );
  assert.deepEqual(linesOf(analyzeFile({ text, file: 'scripts/x.mjs' })), [2]);
});

void test('EXCEPTION 1 : directives fonctionnelles -> 0 offense', () => {
  const directives = [
    '// eslint-disable-next-line no-console',
    '/* eslint-disable @typescript-eslint/no-explicit-any */',
    '// @ts-ignore',
    '// @ts-expect-error message',
    '// @ts-nocheck',
    '// prettier-ignore',
    '/// <reference types="node" />',
    '/** @deprecated utiliser `next()` a la place */',
    '// istanbul ignore next',
    '// gitleaks:allow',
  ];
  for (const directive of directives) {
    assert.deepEqual(
      ts(L(directive, 'const a = 1;')),
      [],
      `directive refusee : ${directive}`,
    );
  }
});

void test('EXCEPTION 1 : shebang d un script executable -> 0 offense', () => {
  assert.deepEqual(
    analyzeFile({
      text: L('#!/usr/bin/env node', 'run();'),
      file: 'scripts/x.mjs',
    }),
    [],
  );
});

void test('ANTI-TROU : une directive CITEE en milieu de phrase reste de la prose', () => {
  assert.deepEqual(
    linesOf(ts('// on ajoutera un eslint-disable ici plus tard')),
    [1],
  );
  assert.deepEqual(
    linesOf(ts('// voir @ts-expect-error dans le fichier voisin')),
    [1],
  );
});

void test('ANTI-TROU : une directive n acquitte jamais sa ligne voisine', () => {
  const off = ts(
    L(
      '/* eslint-disable no-console',
      ' * et voici pourquoi on a fait ce choix',
      ' */',
    ),
  );
  assert.deepEqual(linesOf(off), [2]);
});

void test('EXCEPTION 2 : commentaire seul contenu d un `catch {}` -> 0 offense', () => {
  const text = L(
    'try {',
    '  risky();',
    '} catch {',
    '  // erreur ignoree volontairement',
    '}',
  );
  assert.deepEqual(ts(text), []);
});

void test('EXCEPTION 2 : meme acquittement pour `catch (e) {}` et pour un `{}` de callback', () => {
  const withParam = L(
    'try {',
    '  risky();',
    '} catch (e) {',
    '  /* rien a faire */',
    '}',
  );
  assert.deepEqual(ts(withParam), []);
  const callback = L('p.catch(() => {', '  /* ignore si pas admin */', '});');
  assert.deepEqual(ts(callback), []);
});

void test('EXCEPTION 2 : le bloc doit etre VIDE — un bloc qui porte du code ne couvre pas son commentaire', () => {
  const text = L(
    'try {',
    '  risky();',
    '} catch {',
    '  // on avale et on trace',
    '  log();',
    '}',
  );
  assert.deepEqual(linesOf(ts(text)), [4]);
});

void test('EXCEPTION 2 : un bloc vide ne blanchit pas du code commente ni un TODO', () => {
  const dead = L('try {', '  risky();', '} catch {', '  // log(err);', '}');
  assert.deepEqual(
    ts(dead).map((o) => o.reason),
    ['code commente'],
  );
  const todo = L(
    'try {',
    '  risky();',
    '} catch {',
    '  // TODO traiter cette erreur',
    '}',
  );
  assert.deepEqual(
    ts(todo).map((o) => o.reason),
    ['travail non fait'],
  );
});

void test('EXCEPTION 3 : les attributs i18n d un template Angular ne sont pas des commentaires', () => {
  const html = L(
    '<h1 i18n="@@home.title">Bonjour</h1>',
    '<p i18n-title title="Info">Texte</p>',
  );
  assert.deepEqual(
    analyzeFile({ text: html, file: 'src/app/home.component.html' }),
    [],
  );
});

void test('EXCEPTION 3 : un vrai commentaire HTML narratif reste une offense', () => {
  const html = L('<!-- on affiche le titre ici -->', '<h1>Bonjour</h1>');
  assert.deepEqual(
    linesOf(analyzeFile({ text: html, file: 'src/app/home.component.html' })),
    [1],
  );
});

void test('EXCEPTION 4 : `@ApiProperty({ description })` est du code, jamais un commentaire', () => {
  const text = L(
    'export class Dto {',
    "  @ApiProperty({ description: 'Identifiant public de la ressource' })",
    '  id!: string;',
    '}',
  );
  assert.deepEqual(ts(text), []);
});

void test('EXCEPTION 5 : un commentaire dans une template literal appartient a la sortie du programme', () => {
  const css = L(
    'export const style = `',
    '  /* reset applique au shadow DOM */',
    '  :host { display: block; }',
    '`;',
  );
  assert.deepEqual(ts(css), []);
  const html = L(
    'export const tpl = `',
    '  <!-- entete du mail -->',
    '  <h1>Bonjour</h1>',
    '`;',
  );
  assert.deepEqual(ts(html), []);
});

void test('CONTROLE NEGATIF : `//` dans une chaine ou une regex n est pas un commentaire', () => {
  assert.deepEqual(ts("const u = 'https://exemple.fr/a';"), []);
  assert.deepEqual(ts('const re = /a\\/\\/b/;'), []);
});

void test('CONTROLE NEGATIF : en SCSS, un `//` d URL n ouvre pas un commentaire', () => {
  const scss = L('.a {', '  background: url(https://exemple.fr/img.png);', '}');
  assert.deepEqual(analyzeFile({ text: scss, file: 'src/styles/_a.scss' }), []);
});

void test('SCSS : les deux syntaxes de commentaire sont lues, et une banniere de section est une offense', () => {
  const scss = L(
    '/* --- Section titres --- */',
    '.a {',
    '  // couleur du survol',
    '  color: red;',
    '}',
  );
  assert.deepEqual(
    linesOf(analyzeFile({ text: scss, file: 'src/styles/_a.scss' })),
    [1, 3],
  );
});

void test('EXCEPTION 6 : une contrainte externe citant une RFC est conservee', () => {
  const text = L(
    '/**',
    ' * RFC 8058 §4 : sans ces en-tetes dans le tag `h=`, Gmail ignore',
    ' * le desabonnement en un clic.',
    ' */',
    'const headers = build();',
  );
  assert.deepEqual(ts(text), []);
});

void test('EXCEPTION 6 : les autres formes d ancre externe sont conservees', () => {
  const anchored = [
    '// le piege `use: { reducedMotion }` est sans effet en Playwright 1.59.1',
    '// specificite (0,1,1) : le selecteur parent ne peut pas etre surcharge',
    '// comportement documente sur https://open-meteo.com/en/docs',
    '// CVE-2024-21538 : version minimale imposee par le correctif',
    '// contrainte relevee dans l audit HIGH-2 du 2026-05-09',
    '// la resolution suit celle de `src/main.ts`, jamais celle du proxy',
  ];
  for (const line of anchored) {
    assert.deepEqual(
      ts(L(line, 'const a = 1;')),
      [],
      `ancre refusee : ${line}`,
    );
  }
});

void test('EXCEPTION 6 : nommer une dependance declaree ancre le commentaire', () => {
  const text = L(
    '// nodemailer recoit `from: undefined` et echoue a l envoi',
    'send();',
  );
  assert.deepEqual(
    analyzeFile({
      text,
      file: 'src/a.service.ts',
      dependencies: ['nodemailer'],
    }),
    [],
  );
  assert.deepEqual(
    linesOf(analyzeFile({ text, file: 'src/a.service.ts', dependencies: [] })),
    [1],
  );
});

void test('EXCEPTION 6 : l ancre couvre le bloc contigu, pas la seule ligne qui la porte', () => {
  const text = L(
    '// Le pool est dimensionne pour l usage concurrent API + workers.',
    '// La valeur par defaut saturait sous charge, cf. https://node-postgres.com/apis/pool',
    'const pool = build();',
  );
  assert.deepEqual(ts(text), []);
});

void test('ANTI-TROU : l ancre ne franchit pas la frontiere entre deux blocs separes', () => {
  const text = L(
    '// prose sans aucun fait verifiable',
    '',
    '// voir https://exemple.fr/doc',
    'const a = 1;',
  );
  assert.deepEqual(linesOf(ts(text)), [1]);
});

void test('ANTI-TROU : une ancre ne blanchit ni un TODO ni du code commente', () => {
  const todo = L(
    '// TODO revoir, cf. https://exemple.fr/ticket',
    'const a = 1;',
  );
  assert.deepEqual(
    ts(todo).map((o) => o.reason),
    ['travail non fait'],
  );
  const dead = L(
    '// await queryRunner.query(`DROP TABLE audit_requests`);',
    'const a = 1;',
  );
  assert.deepEqual(
    ts(dead).map((o) => o.reason),
    ['code commente'],
  );
});

void test('perimetre : le code applicatif et l outillage sont inspectes, pas les artefacts', () => {
  for (const file of [
    'src/main.ts',
    'test/app.e2e.spec.ts',
    'scripts/x.mjs',
    'eslint.config.mjs',
  ]) {
    assert.equal(isInScope({ file }), true, `hors perimetre a tort : ${file}`);
  }
  for (const file of [
    'README.md',
    'docs/guide.md',
    'node_modules/x/index.js',
    'coverage/report.js',
    'package.json',
  ]) {
    assert.equal(
      isInScope({ file }),
      false,
      `dans le perimetre a tort : ${file}`,
    );
  }
});

void test('analyzeFile : un fichier hors perimetre n est jamais analyse', () => {
  assert.deepEqual(
    analyzeFile({ text: '// prose libre', file: 'docs/notes.md' }),
    [],
  );
});

void test('offense : file, line et snippet designent la ligne reelle', () => {
  const off = ts(
    L(
      'const a = 1;',
      'const b = 2;',
      '// prose en ligne trois',
      'const c = 3;',
    ),
  );
  assert.deepEqual(off, [
    {
      file: 'src/a.service.ts',
      line: 3,
      reason: 'commentaire narratif sans fait verifiable',
      snippet: '// prose en ligne trois',
    },
  ]);
});

void test('HOOK-WT-1 · collectFiles lit le depot de root sous le GIT_DIR exporte par un pre-push de worktree', () => {
  withRepo(
    { files: { 'src/a.service.ts': 'export const a = 1;\n' } },
    (root) => {
      withRepo(
        { files: { 'src/b.service.ts': 'export const b = 1;\n' } },
        (hookRepo) => {
          underInheritedGitDir(join(hookRepo, '.git'), () => {
            assert.deepEqual(collectFiles({ root }), ['src/a.service.ts']);
          });
        },
      );
    },
  );
});

void test('HOOK-WT-2 · le depot de fixture laisse intact le depot designe par un GIT_DIR herite', () => {
  withRepo(
    { files: { 'src/b.service.ts': 'export const b = 1;\n' } },
    (hookRepo) => {
      underInheritedGitDir(join(hookRepo, '.git'), () => {
        withRepo(
          { files: { 'src/a.service.ts': 'export const a = 1;\n' } },
          () => {},
        );
      });
      assert.deepEqual(
        {
          tracked: gitIn(hookRepo, ['ls-files']),
          bare: gitIn(hookRepo, ['config', 'core.bare']),
        },
        { tracked: 'package.json\nsrc/b.service.ts\n', bare: 'false\n' },
      );
    },
  );
});

void test('PLANCHER ANTI-VACUITE : un perimetre vide leve une erreur citant le gate', () => {
  withRepo({}, (root) => {
    assert.throws(() => runGate({ root }), /guard-no-comments/);
  });
});

void test('runGate : un arbre conforme atteste un nombre de fichiers non nul', () => {
  withRepo(
    { files: { 'src/a.service.ts': 'export const a = 1;\n' } },
    (root) => {
      const result = runGate({ root });
      assert.deepEqual(result.offenders, []);
      assert.equal(result.code, 0);
      assert.equal(result.inspected, 1);
    },
  );
});

void test('runGate : un fichier fautif sort en code 1 avec un chemin relatif a la racine', () => {
  const files = {
    'src/a.service.ts': '// on recupere le user\nexport const a = 1;\n',
  };
  withRepo({ files }, (root) => {
    const result = runGate({ root });
    assert.equal(result.code, 1);
    assert.deepEqual(
      result.offenders.map((o) => [o.file, o.line]),
      [['src/a.service.ts', 1]],
    );
  });
});

void test('CLIQUET : sans plafond declare, la garde exige toujours zero', () => {
  withRepo({ files: { 'src/a.service.ts': narrative(1) } }, (root) => {
    assert.equal(ratchetCeiling(root), 0);
    assert.equal(runGate({ root }).code, 1);
  });
});

void test('CLIQUET : un compte egal au plafond declare passe en code 0', () => {
  const files = { 'src/a.service.ts': narrative(3) };
  withRepo({ files, ratchet: { maxOffenses: 3 } }, (root) => {
    const result = runGate({ root });
    assert.equal(result.ceiling, 3);
    assert.equal(result.offenders.length, 3);
    assert.equal(result.code, 0);
  });
});

void test('CLIQUET : une violation de plus que le plafond sort en code 1', () => {
  const files = { 'src/a.service.ts': narrative(4) };
  withRepo({ files, ratchet: { maxOffenses: 3 } }, (root) => {
    const result = runGate({ root });
    assert.equal(result.code, 1);
    assert.match(
      formatGate(result),
      /REGRESSION — 4 violation\(s\) pour un plafond de 3/,
    );
    assert.match(formatGate(result), /retirez 1 commentaire\(s\)/);
  });
});

void test('CLIQUET : un plafond non entier ou negatif est refuse plutot que subi', () => {
  for (const maxOffenses of [-1, 1.5, '3', null]) {
    withRepo({ ratchet: { maxOffenses } }, (root) => {
      assert.throws(() => ratchetCeiling(root), /maxOffenses/);
    });
  }
});

void test('CLIQUET : sous le plafond, le verdict nomme la valeur exacte a poser', () => {
  const files = { 'src/a.service.ts': narrative(2) };
  withRepo({ files, ratchet: { maxOffenses: 5 } }, (root) => {
    const result = runGate({ root });
    assert.equal(result.code, 0);
    const verdict = formatGate(result);
    assert.match(
      verdict,
      /PLAFOND ABAISSABLE — 2 violation\(s\) sous un plafond de 5 : abaissez-le a 2/,
    );
    assert.match(verdict, /--tighten/);
  });
});

void test('CLIQUET : --tighten abaisse le plafond declare dans package.json', () => {
  const files = { 'src/a.service.ts': narrative(2) };
  withRepo({ files, ratchet: { maxOffenses: 5 } }, (root) => {
    const verdict = tightenCeiling({ root, ...runGate({ root }) });
    assert.match(verdict, /plafond abaisse de 5 a 2/);
    assert.deepEqual(declaredCeiling(root), { maxOffenses: 2 });
    assert.equal(runGate({ root }).ceiling, 2);
  });
});

void test('ANTI-TROU : --tighten ne remonte jamais un plafond depasse', () => {
  const files = { 'src/a.service.ts': narrative(4) };
  withRepo({ files, ratchet: { maxOffenses: 3 } }, (root) => {
    const verdict = tightenCeiling({ root, ...runGate({ root }) });
    assert.match(verdict, /REGRESSION/);
    assert.deepEqual(declaredCeiling(root), { maxOffenses: 3 });
  });
});

void test('CLIQUET : --tighten sur un plafond deja au plus juste n ecrit rien', () => {
  const files = { 'src/a.service.ts': narrative(3) };
  withRepo({ files, ratchet: { maxOffenses: 3 } }, (root) => {
    assert.match(
      tightenCeiling({ root, ...runGate({ root }) }),
      /deja au plus juste \(3\)/,
    );
    assert.deepEqual(declaredCeiling(root), { maxOffenses: 3 });
  });
});

void test('formatGate : le verdict est chiffre et porte le nom du gate', () => {
  const clean = formatGate({ offenders: [], inspected: 42 });
  assert.match(clean, /guard-no-comments: OK/);
  assert.match(clean, /42 fichier\(s\) inspecte\(s\), 0 violation\(s\)/);
  const dirty = formatGate({
    offenders: [
      {
        file: 'src/a.ts',
        line: 7,
        reason: 'commentaire narratif sans fait verifiable',
        snippet: '// x',
      },
    ],
    inspected: 42,
  });
  assert.match(
    dirty,
    /src\/a\.ts:7 — \[commentaire narratif sans fait verifiable\] \/\/ x/,
  );
  assert.match(dirty, /42 fichier\(s\) inspecte\(s\), 1 violation\(s\)/);
});

void test('CLIQUET : sous le plafond, une annotation GitHub porte la valeur a poser', () => {
  const offenders = Array.from({ length: 2 }, () => ({
    file: 'src/a.ts',
    line: 1,
    reason: 'r',
    snippet: 's',
  }));
  const annotation = githubAnnotation({ offenders, ceiling: 5 });
  assert.match(annotation, /^::warning title=guard-no-comments::/);
  assert.match(annotation, /abaissez "guard-no-comments"\.maxOffenses a 2/);
});

void test('CLIQUET : au plafond ou au-dessus, aucune annotation n est emise', () => {
  const one = [{ file: 'src/a.ts', line: 1, reason: 'r', snippet: 's' }];
  assert.equal(githubAnnotation({ offenders: one, ceiling: 1 }), undefined);
  assert.equal(githubAnnotation({ offenders: one, ceiling: 0 }), undefined);
  assert.equal(githubAnnotation({ offenders: [], ceiling: 0 }), undefined);
});

void test('parseArgs : --root, --count et --tighten sont lus depuis argv', () => {
  assert.deepEqual(parseArgs(['--root', '/tmp/x']), {
    root: '/tmp/x',
    count: false,
    tighten: false,
  });
  assert.deepEqual(parseArgs(['--count']), {
    root: '.',
    count: true,
    tighten: false,
  });
  assert.deepEqual(parseArgs(['--tighten']), {
    root: '.',
    count: false,
    tighten: true,
  });
});
