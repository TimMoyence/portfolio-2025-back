import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
 * @returns {string[]}
 */
function trackedFiles(root) {
  const out = execFileSync('git', ['-C', root, 'ls-files', '-z'], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
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
 * @returns {{ code: number, offenders: Offender[], inspected: number }}
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
  return {
    code: offenders.length > 0 ? 1 : 0,
    offenders,
    inspected: readable.length,
  };
}

/**
 * @param {{ offenders: Offender[], inspected: number }} result
 * @returns {string}
 */
export function formatGate({ offenders, inspected }) {
  const attestation = `${GATE}: ${inspected} fichier(s) inspecte(s), ${offenders.length} violation(s).`;
  if (offenders.length === 0)
    return `${GATE}: OK — zero commentaire narratif sans fait verifiable.\n${attestation}`;
  const lines = offenders.map(
    (o) => `${o.file}:${o.line} — [${o.reason}] ${o.snippet}`,
  );
  return [...lines, attestation].join('\n');
}

/**
 * @param {string[]} argv
 * @returns {{ root: string | undefined, count: boolean }}
 */
export function parseArgs(argv) {
  const at = argv.indexOf('--root');
  return {
    root: at >= 0 ? argv[at + 1] : undefined,
    count: argv.includes('--count'),
  };
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
export function main(argv) {
  const { root, count } = parseArgs(argv);
  const result = runGate({ root });
  console.log(
    count ? `${GATE}: ${result.offenders.length}` : formatGate(result),
  );
  return result.code;
}
