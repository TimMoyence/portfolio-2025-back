import { Inject, Injectable } from '@nestjs/common';
import {
  ParticipantNotFoundError,
  SeanceCompleteError,
} from '../domain/errors/FormationErrors';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import {
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { seancePilotablePar } from './SessionAccess';

@Injectable()
export class ReadmettreParticipantUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async execute(
    sessionId: string,
    teacherId: string,
    participantId: string,
  ): Promise<void> {
    const session = await seancePilotablePar(
      this.sessions,
      sessionId,
      teacherId,
    );
    const inscrits = await this.participants.countBySession(sessionId);
    if (inscrits >= session.capacite) {
      throw new SeanceCompleteError(session.capacite);
    }
    const readmis = await this.participants.readmettre(
      sessionId,
      participantId,
    );
    if (!readmis) {
      throw new ParticipantNotFoundError(participantId);
    }
    this.cache.signalerActivite(sessionId);
  }
}
