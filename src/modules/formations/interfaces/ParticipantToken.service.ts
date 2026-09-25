import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { signer } from '../application/SignatureFormations';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import { PARTICIPANTS_REPOSITORY } from '../domain/token';

const SEPARATEUR = '.';
const CONTEXTE = 'participant';
const GENERATION_LISIBLE = /^(0|[1-9]\d{0,8})$/;

export const EN_TETE_JETON = 'x-participant-token';

interface IdentiteSignee {
  readonly participantId: string;
  readonly generation: number;
}

interface JetonLu extends IdentiteSignee {
  readonly empreinte: string;
}

function lireLeJeton(jeton: string | undefined): JetonLu | null {
  const parties = jeton?.split(SEPARATEUR) ?? [];
  if (parties.length !== 3) {
    return null;
  }
  const [participantId, generation, empreinte] = parties;
  if (participantId === '' || !GENERATION_LISIBLE.test(generation)) {
    return null;
  }
  return { participantId, generation: Number(generation), empreinte };
}

export function identiteSignee(
  sessionId: string,
  jeton: string | undefined,
): IdentiteSignee | null {
  const lu = lireLeJeton(jeton);
  if (lu === null) {
    return null;
  }
  const attendue = empreinte(sessionId, lu.participantId, lu.generation);
  return correspond(lu.empreinte, attendue)
    ? { participantId: lu.participantId, generation: lu.generation }
    : null;
}

function correspond(presentee: string, attendue: string): boolean {
  const a = Buffer.from(presentee, 'utf8');
  const b = Buffer.from(attendue, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function empreinte(
  sessionId: string,
  participantId: string,
  generation: number,
): string {
  return signer(`${CONTEXTE}:${sessionId}:${participantId}:${generation}`);
}

/**
 * Jeton de participant : HMAC-SHA256 sur
 * `participant:<sessionId>:<participantId>:<generation>`.
 *
 * Le secret est celui de CloseSession.useCase.ts
 * (FORMATION_REVIEW_TOKEN_SECRET, valide au demarrage par
 * env.validation.ts). Les deux usages restent disjoints grace au prefixe
 * de contexte : aucun message signe ici ne peut etre rejoue comme lien de
 * revision, ni l inverse. RFC 2104 section 3 impose la longueur minimale
 * de cle, verifiee a chaque signature.
 */
@Injectable()
export class ParticipantTokenService {
  constructor(
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
  ) {}

  sign(sessionId: string, participantId: string, generation: number): string {
    return [
      participantId,
      generation,
      empreinte(sessionId, participantId, generation),
    ].join(SEPARATEUR);
  }

  async verify(sessionId: string, jeton: string | undefined): Promise<string> {
    return (await this.verifierIdentite(sessionId, jeton)).participantId;
  }

  async verifierIdentite(
    sessionId: string,
    jeton: string | undefined,
  ): Promise<IdentiteSignee> {
    if (lireLeJeton(jeton) === null) {
      throw new UnauthorizedException(
        'Jeton de participant absent ou illisible',
      );
    }
    const identite = identiteSignee(sessionId, jeton);
    if (identite === null) {
      throw new UnauthorizedException('Jeton de participant invalide');
    }
    const participant = await this.participants.findById(
      identite.participantId,
    );
    if (
      participant === null ||
      participant.sessionId !== sessionId ||
      participant.generationDeJeton !== identite.generation
    ) {
      throw new UnauthorizedException('Jeton de participant revoque');
    }
    return identite;
  }
}
