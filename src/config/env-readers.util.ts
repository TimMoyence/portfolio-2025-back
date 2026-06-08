/**
 * Lecteurs typés de variables d'environnement, mutualisés entre les
 * différentes configurations (audit-requests, sebastian badges, sécurité).
 *
 * Chaque lecteur applique un fallback robuste : une valeur absente, vide ou
 * non parsable retombe sur la valeur par défaut sans jamais throw.
 */

/**
 * Lit une variable d'environnement comme entier.
 *
 * @param name - nom de la variable d'environnement
 * @param fallback - valeur retournée si absente ou non parsable
 * @returns l'entier parsé ou le fallback
 */
export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Lit une variable d'environnement comme nombre décimal.
 *
 * @param name - nom de la variable d'environnement
 * @param fallback - valeur retournée si absente ou non parsable
 * @returns le nombre parsé ou le fallback
 */
export function envFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Lit une variable d'environnement comme booléen (`'true'` / `'false'`,
 * insensible à la casse).
 *
 * @param name - nom de la variable d'environnement
 * @param fallback - valeur retournée si absente ou non reconnue
 * @returns le booléen reconnu ou le fallback
 */
export function envBool(name: string, fallback: boolean): boolean {
  const raw = (process.env[name] ?? '').toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

/**
 * Lit une variable d'environnement comme chaîne non vide (après `trim`).
 *
 * @param name - nom de la variable d'environnement
 * @returns la chaîne nettoyée, ou `undefined` si absente ou vide
 */
export function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}
