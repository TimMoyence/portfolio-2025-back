import { tronquer } from './texte/tronquer';
import { optionalMetadata } from './validation/domain-validators';

export const LONGUEUR_MAX_DU_NAVIGATEUR = 512;
export const LONGUEUR_MAX_DU_REFERENT = 1000;

export interface Provenance {
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

function bornee(valeur: unknown, max: number): string | null {
  const nettoyee = optionalMetadata(valeur);
  return nettoyee === null ? null : tronquer(nettoyee, max);
}

export function navigateurConsignable(brut: unknown): string | null {
  return bornee(brut, LONGUEUR_MAX_DU_NAVIGATEUR);
}

export function provenanceConsignable(brute: Provenance): Required<Provenance> {
  return {
    ip: optionalMetadata(brute.ip),
    userAgent: navigateurConsignable(brute.userAgent),
    referer: bornee(brute.referer, LONGUEUR_MAX_DU_REFERENT),
  };
}
