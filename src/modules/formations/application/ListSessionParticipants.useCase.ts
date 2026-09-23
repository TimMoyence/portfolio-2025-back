import { Inject, Injectable } from '@nestjs/common';
import type {
  IParticipantsRepository,
  ParticipantRecord,
} from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { PARTICIPANTS_REPOSITORY, SESSIONS_REPOSITORY } from '../domain/token';
import { seanceLisiblePar } from './SessionAccess';

export interface ParticipantDeSeance {
  readonly id: string;
  readonly prenom: string;
  readonly nom: string;
  readonly evince: boolean;
}

function presenter(
  participant: ParticipantRecord,
  evince: boolean,
): ParticipantDeSeance {
  return {
    id: participant.id,
    prenom: participant.prenom,
    nom: participant.nom,
    evince,
  };
}

@Injectable()
export class ListSessionParticipantsUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<readonly ParticipantDeSeance[]> {
    await seanceLisiblePar(this.sessions, sessionId, acteur);
    const [inscrits, evinces] = await Promise.all([
      this.participants.listBySession(sessionId),
      this.participants.listEvincesBySession(sessionId),
    ]);
    return [
      ...inscrits.map((participant) => presenter(participant, false)),
      ...evinces.map((participant) => presenter(participant, true)),
    ];
  }
}
