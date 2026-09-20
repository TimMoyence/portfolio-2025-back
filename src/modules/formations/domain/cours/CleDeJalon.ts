import { createHmac } from 'node:crypto';

const LONGUEUR_MIN_SECRET = 32;
const CONTEXTE = 'jalon';

function secretDesJalons(): string {
  const valeur = process.env.FORMATIONS_PULSE_SECRET;
  if (!valeur || valeur.length < LONGUEUR_MIN_SECRET) {
    throw new Error(
      `FORMATIONS_PULSE_SECRET doit etre configure avec au moins ${LONGUEUR_MIN_SECRET} caracteres`,
    );
  }
  return valeur;
}

export function cleDeJalon(sessionId: string, participantId: string): string {
  return createHmac('sha256', secretDesJalons())
    .update(`${CONTEXTE}:${sessionId}:${participantId}`)
    .digest('hex');
}
