import { CATALOGUE_COURS_STATIQUE } from '../src/modules/formations/domain/cours/catalogue';
import { BORNE_GRAINE } from '../src/modules/formations/domain/cours/OuvertureTirages';
import {
  TirageAmbiguError,
  tirer,
} from '../src/modules/formations/domain/cours/Tirage';

const USAGE = 'Usage : pnpm --silent cours:exporter-sujet <slug> <graine>';
const ENTIER_DECIMAL = /^\d+$/;
const ECHEC = 1;
const SUCCES = 0;

function signaler(message: string): number {
  process.stderr.write(`${message}\n${USAGE}\n`);
  return ECHEC;
}

function lireGraine(brute: string): number | null {
  if (!ENTIER_DECIMAL.test(brute)) {
    return null;
  }
  const graine = Number(brute);
  return graine < BORNE_GRAINE ? graine : null;
}

function exporterSujet(argumentsRecus: readonly string[]): number {
  const slug = argumentsRecus.at(0) ?? '';
  const brute = argumentsRecus.at(1) ?? '';
  const cours = CATALOGUE_COURS_STATIQUE.trouver(slug);
  if (cours === null) {
    return signaler(`Cours inconnu du catalogue publie : « ${slug} ».`);
  }
  const graine = lireGraine(brute);
  if (graine === null) {
    return signaler(
      `Graine invalide « ${brute} » : entier attendu dans [0, ${BORNE_GRAINE}).`,
    );
  }
  try {
    const { sujet } = tirer(cours, graine);
    process.stdout.write(`${JSON.stringify(sujet, null, 2)}\n`);
    return SUCCES;
  } catch (erreur) {
    if (erreur instanceof TirageAmbiguError) {
      return signaler(`${erreur.message} : choisissez une autre graine.`);
    }
    throw erreur;
  }
}

process.exitCode = exporterSujet(process.argv.slice(2));
