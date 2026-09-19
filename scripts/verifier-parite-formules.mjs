#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chargerMoteur,
  ecartsAvecLesAttendus,
  ecartsEntreMoteurs,
  empreinteDesVecteurs,
  lireFichierDeVecteurs,
  resultatsDesVecteurs,
} from './lib/vecteurs-formules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPILATEUR = join(ROOT, 'node_modules/typescript/lib/typescript.js');
const VECTEURS_BACK = join(
  ROOT,
  'src/modules/formations/domain/cours/formule.vecteurs.json',
);
const MOTEUR_BACK = join(
  ROOT,
  'src/modules/formations/domain/cours/Formule.ts',
);
const VECTEURS_FRONT = 'src/cours/runtime/core/formule.vecteurs.json';
const MOTEUR_FRONT = 'src/cours/runtime/core/formula.ts';
const DEPOT_FRONT_PAR_DEFAUT = resolve(ROOT, '../portfolio-2025-front');
const DEPOT_GITHUB_FRONT = 'TimMoyence/portfolio-2025-front';
const BRANCHE_PRINCIPALE = 'master';

/**
 * @param {string[]} argv
 * @returns {{ front: string, strict: boolean }}
 */
export function lireArguments(argv) {
  const front = argv.find((arg) => arg.startsWith('--front='));
  return {
    front: front
      ? resolve(front.slice('--front='.length))
      : (process.env.DEPOT_FRONT ?? DEPOT_FRONT_PAR_DEFAUT),
    strict: argv.includes('--strict'),
  };
}

/**
 * @returns {string | null}
 */
function empreinteDistanteDuFront() {
  try {
    const brut = execFileSync(
      'gh',
      [
        'api',
        `repos/${DEPOT_GITHUB_FRONT}/contents/${VECTEURS_FRONT}?ref=${BRANCHE_PRINCIPALE}`,
        '--jq',
        '.content',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const fichier = JSON.parse(Buffer.from(brut, 'base64').toString('utf8'));
    return empreinteDesVecteurs(fichier.vecteurs);
  } catch {
    return null;
  }
}

/**
 * @param {string[]} anomalies
 * @param {string[]} remarques
 * @returns {Promise<void>}
 */
async function controlerLeBack(anomalies, remarques) {
  const fichier = lireFichierDeVecteurs(VECTEURS_BACK);
  const empreinte = empreinteDesVecteurs(fichier.vecteurs);
  if (empreinte !== fichier.sha256) {
    anomalies.push(
      `empreinte du back : declaree ${fichier.sha256}, calculee ${empreinte}`,
    );
  }
  const { moteur, liberer } = await chargerMoteur(MOTEUR_BACK, COMPILATEUR);
  try {
    const obtenus = resultatsDesVecteurs(moteur, fichier.vecteurs);
    anomalies.push(...ecartsAvecLesAttendus(obtenus, fichier.vecteurs));
    remarques.push(
      `back : ${fichier.vecteurs.length} vecteurs executes, empreinte ${empreinte}`,
    );
    return { fichier, obtenus };
  } finally {
    liberer();
  }
}

/**
 * @param {string} depotFront
 * @param {{ fichier: any, obtenus: Record<string, string> }} back
 * @param {string[]} anomalies
 * @param {string[]} remarques
 * @param {boolean} strict
 * @returns {Promise<void>}
 */
async function controlerLeFront(
  depotFront,
  back,
  anomalies,
  remarques,
  strict,
) {
  const cheminVecteurs = join(depotFront, VECTEURS_FRONT);
  const cheminMoteur = join(depotFront, MOTEUR_FRONT);
  if (!existsSync(cheminVecteurs) || !existsSync(cheminMoteur)) {
    const distante = empreinteDistanteDuFront();
    if (distante === null) {
      const message = `front absent en local (${depotFront}) et empreinte distante indisponible (gh api) : parite inter-depot non verifiee`;
      if (strict) anomalies.push(message);
      else remarques.push(message);
      return;
    }
    if (distante !== back.fichier.sha256) {
      anomalies.push(
        `empreinte du front sur ${BRANCHE_PRINCIPALE} : ${distante}, back : ${back.fichier.sha256}`,
      );
      return;
    }
    remarques.push(
      `front (${BRANCHE_PRINCIPALE}, gh api) : meme empreinte, moteur non execute`,
    );
    return;
  }

  if (
    readFileSync(cheminVecteurs, 'utf8') !== readFileSync(VECTEURS_BACK, 'utf8')
  ) {
    anomalies.push(
      `${VECTEURS_FRONT} n est pas identique au fichier canonique du back`,
    );
  }
  const { moteur, liberer } = await chargerMoteur(cheminMoteur, COMPILATEUR);
  try {
    const obtenus = resultatsDesVecteurs(moteur, back.fichier.vecteurs);
    anomalies.push(...ecartsAvecLesAttendus(obtenus, back.fichier.vecteurs));
    anomalies.push(...ecartsEntreMoteurs(back.obtenus, obtenus));
    remarques.push(
      `front (${depotFront}) : ${back.fichier.vecteurs.length} vecteurs executes, memes resultats que le back`,
    );
  } finally {
    liberer();
  }
}

/**
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function main(argv) {
  const { front, strict } = lireArguments(argv);
  /** @type {string[]} */
  const anomalies = [];
  /** @type {string[]} */
  const remarques = [];

  const back = await controlerLeBack(anomalies, remarques);
  await controlerLeFront(front, back, anomalies, remarques, strict);

  for (const remarque of remarques) {
    console.log(`parite-formules: ${remarque}`);
  }
  if (anomalies.length > 0) {
    for (const anomalie of anomalies) {
      console.error(`parite-formules: ${anomalie}`);
    }
    console.error(
      `parite-formules: ECHEC — ${anomalies.length} ecart(s) de parite.`,
    );
    return 1;
  }
  console.log('parite-formules: OK — vecteurs signes et moteurs concordants.');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
