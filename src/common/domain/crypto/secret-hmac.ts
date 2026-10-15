import { envBrut } from '../../../config/env-readers.util';
import type { CryptographicSecretKey } from '../../../config/env.validation';
import { hmacSha256 } from './empreintes';

const LONGUEUR_MIN_DU_SECRET = 32;

/**
 * RFC 2104 section 3 recommande une cle HMAC au moins aussi longue que le
 * digest (32 octets pour SHA-256) : une cle vide ou trop courte affaiblit
 * la protection, ici sur des entrees deja publiques (identifiants de seance
 * et de participant). Refuser de produire une signature est donc la seule
 * option sure.
 */
export function secretHmac(nom: CryptographicSecretKey): string {
  const secret = envBrut(nom);
  if (!secret || secret.length < LONGUEUR_MIN_DU_SECRET) {
    throw new Error(
      `${nom} doit etre configure avec au moins ${LONGUEUR_MIN_DU_SECRET} caracteres`,
    );
  }
  return secret;
}

export function signerAvecLeSecret(
  nom: CryptographicSecretKey,
  message: string,
): string {
  return hmacSha256(secretHmac(nom), message).toString('hex');
}
