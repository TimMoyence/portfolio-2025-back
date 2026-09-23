import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  blockOffenses,
  declaredDependencies,
} from './lib/comment-doctrine.mjs';
import {
  markupBlocks,
  sourceBlocks,
  styleBlocks,
} from './lib/comment-extract.mjs';
import { hasJsdocTypes, isInScope, languageOf } from './lib/comment-scope.mjs';

export const GATE = 'guard-no-comments';

/** @typedef {{ file: string, line: number, reason: string, snippet: string }} Offender */

export { isInScope };

/**
 * @param {{ text: string, file: string }} input
 * @returns {import('./lib/comment-extract.mjs').ExtractedBlock[]}
 */
function blocksOf({ text, file }) {
  const lang = languageOf(file);
  if (lang === 'style') return styleBlocks({ text });
  if (lang === 'markup') return markupBlocks({ text });
  return sourceBlocks({ text, file });
}

/**
 * @param {{ text: string, file: string, dependencies?: string[] }} input
 * @returns {Offender[]}
 */
export function analyzeFile({ text, file, dependencies = [] }) {
  if (!isInScope({ file })) return [];
  const lines = text.split('\n');
  const jsdocTypes = hasJsdocTypes(file);
  return blocksOf({ text, file })
    .flatMap((block) =>
      blockOffenses(block, {
        jsdocTypes,
        emptyBlock: block.emptyBlock,
        dependencies,
      }),
    )
    .sort((a, b) => a.line - b.line)
    .map(({ line, reason }) => ({
      file,
      line,
      reason,
      snippet: (lines[line - 1] ?? '').trim(),
    }));
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function rootDependencies(root) {
  const manifest = join(root, 'package.json');
  if (!existsSync(manifest)) return [];
  return declaredDependencies(JSON.parse(readFileSync(manifest, 'utf8')));
}

/**
 * @param {string} root
 * @returns {number}
 */
export function ratchetCeiling(root) {
  const manifest = join(root, 'package.json');
  if (!existsSync(manifest)) return 0;
  const declared = JSON.parse(readFileSync(manifest, 'utf8'))[GATE]
    ?.maxOffenses;
  if (declared === undefined) return 0;
  if (!Number.isInteger(declared) || declared < 0) {
    throw new Error(
      `${GATE}: "${GATE}".maxOffenses vaut ${JSON.stringify(declared)} dans ${manifest} — attendu un entier positif ou nul.`,
    );
  }
  return declared;
}

/**
 * @param {{ root: string, ceiling: number }} input
 * @returns {void}
 */
function writeCeiling({ root, ceiling }) {
  const manifest = join(root, 'package.json');
  const parsed = JSON.parse(readFileSync(manifest, 'utf8'));
  parsed[GATE] = { ...parsed[GATE], maxOffenses: ceiling };
  writeFileSync(manifest, `${JSON.stringify(parsed, null, 2)}\n`);
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {NodeJS.ProcessEnv}
 */
export function isolatedGitEnv(env = process.env) {
  return Object.fromEntries(
    Object.entries(env).filter(([name]) => !name.startsWith('GIT_')),
  );
}

/**
 * @param {string} root
 * @returns {string[]}
 */
function trackedFiles(root) {
  const out = execFileSync('git', ['-C', root, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    env: isolatedGitEnv(),
  });
  return out.split('\0').filter(Boolean);
}

/**
 * @param {{ root: string }} input
 * @returns {string[]}
 */
export function collectFiles({ root }) {
  return trackedFiles(root).filter((file) => isInScope({ file }));
}

/**
 * @param {{ root?: string }} [input]
 * @returns {{ code: number, offenders: Offender[], inspected: number, ceiling: number }}
 */
export function runGate({ root = '.' } = {}) {
  const files = collectFiles({ root });
  if (files.length === 0) {
    throw new Error(
      `${GATE}: aucun fichier du perimetre sous ${root} — un gate qui n'inspecte rien n'atteste rien.`,
    );
  }
  const readable = files.filter((rel) => existsSync(join(root, rel)));
  if (readable.length === 0) {
    throw new Error(
      `${GATE}: 0 fichier reellement lu sous ${root} — verdict non falsifiable.`,
    );
  }
  const dependencies = rootDependencies(root);
  const offenders = readable.flatMap((rel) =>
    analyzeFile({
      text: readFileSync(join(root, rel), 'utf8'),
      file: rel,
      dependencies,
    }),
  );
  const ceiling = ratchetCeiling(root);
  return {
    code: offenders.length > ceiling ? 1 : 0,
    offenders,
    inspected: readable.length,
    ceiling,
  };
}

export const TIGHTEN_COMMAND =
  'node scripts/guard-no-comments.cli.mjs --root . --tighten';

/**
 * @param {{ offenders: Offender[], inspected: number, ceiling?: number }} result
 * @returns {string}
 */
export function formatGate({ offenders, inspected, ceiling = 0 }) {
  const count = offenders.length;
  const attestation = `${GATE}: ${inspected} fichier(s) inspecte(s), ${count} violation(s), plafond ${ceiling}.`;
  if (count > ceiling) {
    const lines = offenders.map(
      (o) => `${o.file}:${o.line} — [${o.reason}] ${o.snippet}`,
    );
    return [
      ...lines,
      attestation,
      `${GATE}: REGRESSION — ${count} violation(s) pour un plafond de ${ceiling}. Le cliquet ne remonte jamais : retirez ${count - ceiling} commentaire(s) parmi ceux listes ci-dessus.`,
    ].join('\n');
  }
  if (count < ceiling) {
    return [
      attestation,
      `${GATE}: PLAFOND ABAISSABLE — ${count} violation(s) sous un plafond de ${ceiling} : abaissez-le a ${count}.`,
      `${GATE}: posez ${count} dans "${GATE}".maxOffenses (package.json), ou lancez \`${TIGHTEN_COMMAND}\`.`,
    ].join('\n');
  }
  return count === 0
    ? `${GATE}: OK — zero commentaire narratif sans fait verifiable.\n${attestation}`
    : `${GATE}: OK — plafond tenu, aucune regression.\n${attestation}`;
}

/**
 * @param {{ root: string, offenders: Offender[], inspected: number, ceiling: number }} result
 * @returns {string}
 */
export function tightenCeiling({ root, offenders, inspected, ceiling }) {
  const count = offenders.length;
  if (count > ceiling) return formatGate({ offenders, inspected, ceiling });
  if (count === ceiling)
    return `${GATE}: plafond deja au plus juste (${ceiling}) — rien a abaisser.`;
  writeCeiling({ root, ceiling: count });
  return `${GATE}: plafond abaisse de ${ceiling} a ${count} dans ${join(root, 'package.json')}.`;
}

/**
 * @param {{ offenders: Offender[], ceiling: number }} result
 * @returns {string | undefined}
 */
export function githubAnnotation({ offenders, ceiling }) {
  const count = offenders.length;
  if (count >= ceiling) return undefined;
  return `::warning title=${GATE}::${count} violation(s) sous un plafond de ${ceiling} — abaissez "${GATE}".maxOffenses a ${count} dans package.json, ou lancez \`${TIGHTEN_COMMAND}\`.`;
}

/**
 * @param {string[]} argv
 * @returns {{ root: string, count: boolean, tighten: boolean }}
 */
export function parseArgs(argv) {
  const at = argv.indexOf('--root');
  return {
    root: at >= 0 ? argv[at + 1] : '.',
    count: argv.includes('--count'),
    tighten: argv.includes('--tighten'),
  };
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
export function main(argv) {
  const { root, count, tighten } = parseArgs(argv);
  const result = runGate({ root });
  if (count) {
    console.log(`${GATE}: ${result.offenders.length}`);
    return result.code;
  }
  if (tighten) {
    console.log(tightenCeiling({ root, ...result }));
    return result.code;
  }
  console.log(formatGate(result));
  const annotation = githubAnnotation(result);
  if (annotation && process.env.GITHUB_ACTIONS === 'true')
    console.log(annotation);
  return result.code;
}
