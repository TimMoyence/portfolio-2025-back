import { LienInvalideError } from './errors/LienInvalideError';

export const PARAMETRE_DU_JETON = 'token';

export const PAGE_PRIVEE_DU_TOOLKIT = '/formations/ia-solopreneurs/toolkit/';

export function lienAvecJeton(base: string, jeton: string): string {
  if (!URL.canParse(base)) {
    const separateur = base.includes('?') ? '&' : '?';
    return `${base}${separateur}${PARAMETRE_DU_JETON}=${encodeURIComponent(jeton)}`;
  }
  const url = new URL(base);
  url.searchParams.set(PARAMETRE_DU_JETON, jeton);
  return url.toString();
}

export function jetonDeLien(valeur: unknown, forme: RegExp): string {
  if (typeof valeur !== 'string' || !forme.test(valeur)) {
    throw new LienInvalideError();
  }
  return valeur;
}
