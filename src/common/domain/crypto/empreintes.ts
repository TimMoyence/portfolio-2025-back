import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

type Octets = string | Buffer;

function condense(contenu: Octets): Buffer {
  return createHash('sha256').update(contenu).digest();
}

export function empreinteSha256(texte: string): string {
  return condense(texte).toString('hex');
}

export function hmacSha256(
  secret: string,
  ...parties: readonly Octets[]
): Buffer {
  const hmac = createHmac('sha256', secret);
  for (const partie of parties) {
    hmac.update(partie);
  }
  return hmac.digest();
}

/**
 * `timingSafeEqual` leve sur deux tampons de longueurs differentes
 * (https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b) : comparer
 * les condenses SHA-256, de longueur fixe, evite cette levee et ne laisse
 * pas la longueur de la valeur attendue transparaitre dans le temps de
 * reponse.
 */
export function egalEnTempsConstant(
  presente: Octets,
  attendue: Octets,
): boolean {
  return timingSafeEqual(condense(presente), condense(attendue));
}
