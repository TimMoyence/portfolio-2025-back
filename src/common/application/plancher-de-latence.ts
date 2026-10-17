import { randomInt } from 'node:crypto';
import type { JournalDesEchecs } from './en-arriere-plan';
import { enArrierePlan } from './en-arriere-plan';

const PLANCHER_MS = 300;
const ALEA_MAX_MS = 50;

const cibleDeLatence = (): number => PLANCHER_MS + randomInt(ALEA_MAX_MS);

const attendre = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Plancher de latence d'une réponse publique dont le travail dépend de
 * l'existence d'un compte ou d'une adresse : sans lui, le temps de réponse
 * trahit cette existence (CWE-208).
 */
export async function avecUnPlancherDeLatence<T>(
  travail: () => Promise<T>,
): Promise<T> {
  const debut = Date.now();
  try {
    return await travail();
  } finally {
    const cible = cibleDeLatence();
    const ecoule = Date.now() - debut;
    if (ecoule < cible) {
      await attendre(cible - ecoule);
    }
  }
}

export async function aHeureFixe<T>(
  travail: () => Promise<T>,
  reponsePrevue: T,
  echec: string,
  journal: JournalDesEchecs,
): Promise<T> {
  let reglee = false;
  const marquer = () => {
    reglee = true;
  };
  const tache = travail();
  void tache.then(marquer, marquer);
  await attendre(cibleDeLatence());
  if (reglee) {
    return tache;
  }
  enArrierePlan(tache, echec, journal);
  return reponsePrevue;
}
