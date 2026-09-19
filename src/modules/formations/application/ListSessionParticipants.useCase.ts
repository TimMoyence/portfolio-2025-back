import { Inject, Injectable } from '@nestjs/common';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import { PARTICIPANTS_REPOSITORY, SESSIONS_REPOSITORY } from '../domain/token';
import { seanceLisiblePar } from './SessionAccess';

export interface ParticipantDeSeance {
  readonly id: string;
  readonly prenom: string;
  readonly nom: string;
  readonly groupId: string | null;
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
    const inscrits = await this.participants.listBySession(sessionId);
    return inscrits.map((participant) => ({
      id: participant.id,
      prenom: participant.prenom,
      nom: participant.nom,
      groupId: participant.groupId ?? null,
    }));
  }
}
