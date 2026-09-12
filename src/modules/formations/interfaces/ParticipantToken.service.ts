import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET_LONGUEUR_MIN = 32;
const SEPARATEUR = '.';
const CONTEXTE = 'participant';

export const EN_TETE_JETON = 'x-participant-token';

function participantIdDuJeton(jeton: string): string | null {
  const separateur = jeton.lastIndexOf(SEPARATEUR);
  return separateur > 0 ? jeton.slice(0, separateur) : null;
}

export function participantIdVerifie(
  sessionId: string,
  jeton: string | undefined,
): string | null {
  const participantId = jeton ? participantIdDuJeton(jeton) : null;
  if (!jeton || participantId === null) {
    return null;
  }
  const presentee = jeton.slice(participantId.length + 1);
  return correspond(presentee, empreinte(sessionId, participantId))
    ? participantId
    : null;
}

function correspond(presentee: string, attendue: string): boolean {
  const a = Buffer.from(presentee, 'utf8');
  const b = Buffer.from(attendue, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function empreinte(sessionId: string, participantId: string): string {
  return createHmac('sha256', secret())
    .update(`${CONTEXTE}:${sessionId}:${participantId}`)
    .digest('hex');
}

function secret(): string {
  const valeur = process.env.FORMATION_REVIEW_TOKEN_SECRET;
  if (!valeur || valeur.length < SECRET_LONGUEUR_MIN) {
    throw new Error(
      `FORMATION_REVIEW_TOKEN_SECRET doit etre configure avec au moins ${SECRET_LONGUEUR_MIN} caracteres`,
    );
  }
  return valeur;
}

/**
 * Jeton de participant : HMAC-SHA256 sur `participant:<sessionId>:<participantId>`.
 *
 * Le secret est celui de CloseSession.useCase.ts
 * (FORMATION_REVIEW_TOKEN_SECRET, valide au demarrage par
 * env.validation.ts). Les deux usages restent disjoints grace au prefixe
 * de contexte : aucun message signe ici ne peut etre rejoue comme lien de
 * revision, ni l inverse. RFC 2104 section 3 impose la longueur minimale
 * de cle, verifiee a chaque signature.
 *
 * Le `sessionId` fait partie du message signe : sans lui, le jeton emis
 * dans une session servirait a repondre dans une autre.
 */
@Injectable()
export class ParticipantTokenService {
  sign(sessionId: string, participantId: string): string {
    return `${participantId}${SEPARATEUR}${empreinte(sessionId, participantId)}`;
  }

  verify(sessionId: string, jeton: string | undefined): string {
    const lisible = jeton ? participantIdDuJeton(jeton) : null;
    if (lisible === null) {
      throw new UnauthorizedException(
        'Jeton de participant absent ou illisible',
      );
    }
    const participantId = participantIdVerifie(sessionId, jeton);
    if (participantId === null) {
      throw new UnauthorizedException('Jeton de participant invalide');
    }
    return participantId;
  }
}
