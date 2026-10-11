#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAQUET = 'portfolio-2025-partage';
const MANIFESTE_DU_FRONT_SUR_MASTER =
  'repos/TimMoyence/portfolio-2025-front/contents/package.json?ref=master';

/**
 * @param {{ dependencies?: Record<string, string> }} manifeste
 * @returns {string | undefined}
 */
const sourceDuPaquet = (manifeste) => manifeste.dependencies?.[PAQUET];

/**
 * @param {{ dependencies?: Record<string, string> }} back
 * @param {{ dependencies?: Record<string, string> }} front
 * @returns {{ bloquant: boolean, message: string }}
 */
export function comparerLesSources(back, front) {
  const [deBack, deFront] = [sourceDuPaquet(back), sourceDuPaquet(front)];
  if (deBack === undefined) {
    return { bloquant: true, message: `le back ne depend pas de ${PAQUET}` };
  }
  if (deFront === undefined) {
    return {
      bloquant: false,
      message: `le front ne depend pas encore de ${PAQUET}`,
    };
  }
  if (deBack !== deFront) {
    return {
      bloquant: true,
      message: `sources divergentes : back ${deBack}, front ${deFront}`,
    };
  }
  return { bloquant: false, message: `meme source ${deBack}` };
}

/** @returns {{ origine: string, manifeste: any }} */
function manifesteDuFront() {
  const depot =
    process.env.DEPOT_FRONT ?? resolve(ROOT, '../portfolio-2025-front');
  const local = join(depot, 'package.json');
  if (existsSync(local)) {
    return {
      origine: depot,
      manifeste: JSON.parse(readFileSync(local, 'utf8')),
    };
  }
  const contenu = execFileSync(
    'gh',
    ['api', MANIFESTE_DU_FRONT_SUR_MASTER, '--jq', '.content'],
    { encoding: 'utf8' },
  );
  return {
    origine: 'front sur master (gh api)',
    manifeste: JSON.parse(Buffer.from(contenu, 'base64').toString('utf8')),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const back = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const { origine, manifeste } = manifesteDuFront();
  const { bloquant, message } = comparerLesSources(back, manifeste);
  console[bloquant ? 'error' : 'log'](
    `paquet-partage (${origine}) : ${message}`,
  );
  process.exitCode = bloquant ? 1 : 0;
}
