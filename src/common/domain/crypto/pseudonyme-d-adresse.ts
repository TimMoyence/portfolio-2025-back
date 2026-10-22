import { hmacSha256 } from './empreintes';

const CONTEXTE = 'journal:adresse';
const LONGUEUR_DU_PSEUDONYME = 16;

export function pseudonymeDAdresse(secret: string, email: string): string {
  return hmacSha256(secret, `${CONTEXTE}:${email.trim().toLowerCase()}`)
    .toString('hex')
    .slice(0, LONGUEUR_DU_PSEUDONYME);
}
