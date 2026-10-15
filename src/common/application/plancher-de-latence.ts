import { randomInt } from 'node:crypto';

const PLANCHER_MS = 300;
const ALEA_MAX_MS = 50;

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
    const cible = PLANCHER_MS + randomInt(ALEA_MAX_MS);
    const ecoule = Date.now() - debut;
    if (ecoule < cible) {
      await new Promise<void>((resolve) => setTimeout(resolve, cible - ecoule));
    }
  }
}
