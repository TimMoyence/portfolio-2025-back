import {
  EN_TETE_JETON,
  participantIdDuJeton,
} from './ParticipantToken.service';

export const FENETRE_THROTTLE_MS = 60_000;
export const LIMITE_JOIN_PAR_CODE = 120;
export const LIMITE_REPONSES_PAR_PARTICIPANT = 60;
export const LIMITE_INCIDENTS_PAR_PARTICIPANT = 30;
export const LIMITE_FLUX_PAR_PARTICIPANT = 30;

/**
 * Les trente postes d'une salle informatique sortent par une seule adresse
 * publique : compter sur `req.ip` (le defaut de @nestjs/throttler 6.5)
 * revient a repartir la limite entre tous les etudiants de la classe.
 *
 * Le compteur est donc indexe sur ce qui identifie l'appelant : le jeton de
 * participant sur les routes qui en exigent un, le code de seance sur
 * l'inscription ou aucun jeton n'existe encore. L'adresse reste le repli
 * quand aucune de ces cles n'est presentee, et le balayage de codes
 * inconnus reste borne par adresse dans CodeScanProtection.service.ts.
 */
export function suivreParCodeDeSession(req: Record<string, unknown>): string {
  const params = req.params as Record<string, unknown> | undefined;
  const code = params?.code;
  return typeof code === 'string' && code.length > 0
    ? `code:${code}`
    : parAdresse(req);
}

export function suivreParParticipant(req: Record<string, unknown>): string {
  const entetes = req.headers as Record<string, unknown> | undefined;
  const jeton = entetes?.[EN_TETE_JETON];
  if (typeof jeton !== 'string') {
    return parAdresse(req);
  }
  const participantId = participantIdDuJeton(jeton);
  return participantId === null
    ? parAdresse(req)
    : `participant:${participantId}`;
}

function parAdresse(req: Record<string, unknown>): string {
  const ip = req.ip;
  return typeof ip === 'string' ? `ip:${ip}` : 'ip:inconnue';
}
