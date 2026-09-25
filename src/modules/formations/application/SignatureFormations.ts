import { createHmac } from 'node:crypto';

const SECRET_LONGUEUR_MIN = 32;

/**
 * RFC 2104 section 3 recommande une cle HMAC au moins aussi longue que le
 * digest (32 octets pour SHA-256) : une cle vide ou trop courte affaiblit
 * la protection, ici sur une entree deja publique (le `sessionId` figure
 * dans l'URL du flux temps reel, le `participantId` est connu de
 * l'etudiant). Refuser de produire un jeton est donc la seule option sure.
 */
export function secretDeSignature(): string {
  const secret = process.env.FORMATION_REVIEW_TOKEN_SECRET;
  if (!secret || secret.length < SECRET_LONGUEUR_MIN) {
    throw new Error(
      `FORMATION_REVIEW_TOKEN_SECRET doit etre configure avec au moins ${SECRET_LONGUEUR_MIN} caracteres`,
    );
  }
  return secret;
}

export function signer(message: string): string {
  return createHmac('sha256', secretDeSignature())
    .update(message)
    .digest('hex');
}
