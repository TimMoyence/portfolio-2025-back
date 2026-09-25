import { Throttle } from '@nestjs/throttler';
import { EN_TETE_JETON, identiteSignee } from './ParticipantToken.service';

export const FENETRE_THROTTLE_MS = 60_000;
export const LIMITE_CONTROLE_PAR_MINUTE = 240;
export const LIMITE_LECTURE_FORMATEUR_PAR_MINUTE = 240;
export const LIMITE_JOIN_PAR_CODE = 120;
export const LIMITE_REPONSES_PAR_PARTICIPANT = 60;
export const LIMITE_INCIDENTS_PAR_PARTICIPANT = 30;
export const LIMITE_FLUX_PAR_PARTICIPANT = 30;
export const LIMITE_REVISION_PAR_PARTICIPANT = 30;
export const LIMITE_SUJET_PAR_PARTICIPANT = 180;
export const LIMITE_TENTATIVES_PAR_PARTICIPANT = 20;
export const LIMITE_JALONS_PAR_PARTICIPANT = 30;
export const LIMITE_ETAT_PAR_PARTICIPANT = 30;
export const LIMITE_EVICTION_PAR_MINUTE = 60;
export const LIMITE_RAPPELS_PAR_PARTICIPANT = 30;
export const LIMITE_SYNTHESE_PAR_MINUTE = 60;

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
 *
 * La signature du jeton est verifiee avant d'en tirer une cle : un jeton
 * seulement bien forme laisserait l'appelant choisir son propre seau, donc
 * s'en fabriquer un neuf a chaque requete.
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
  const params = req.params as Record<string, unknown> | undefined;
  const sessionId = params?.id;
  if (typeof jeton !== 'string' || typeof sessionId !== 'string') {
    return parAdresse(req);
  }
  const identite = identiteSigneeSansLever(sessionId, jeton);
  return identite === null
    ? parAdresse(req)
    : `participant:${identite.participantId}:${identite.generation}`;
}

export function LimiteParMinute(limit: number): MethodDecorator {
  return Throttle({ default: { limit, ttl: FENETRE_THROTTLE_MS } });
}

export function LimiteParParticipant(limit: number): MethodDecorator {
  return Throttle({
    default: {
      limit,
      ttl: FENETRE_THROTTLE_MS,
      getTracker: suivreParParticipant,
    },
  });
}

function identiteSigneeSansLever(
  sessionId: string,
  jeton: string,
): ReturnType<typeof identiteSignee> {
  try {
    return identiteSignee(sessionId, jeton);
  } catch {
    return null;
  }
}

function parAdresse(req: Record<string, unknown>): string {
  const ip = req.ip;
  return typeof ip === 'string' ? `ip:${ip}` : 'ip:inconnue';
}
