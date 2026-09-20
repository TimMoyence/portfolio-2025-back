import { Inject, Injectable } from '@nestjs/common';
import { ParticipantNotFoundError } from '../domain/errors/FormationErrors';
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
export class EvincerParticipantUseCase {
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
    await seancePilotablePar(this.sessions, sessionId, teacherId);
    const evince = await this.participants.evincer(sessionId, participantId);
    if (!evince) {
      throw new ParticipantNotFoundError(participantId);
    }
    this.cache.signalerActivite(sessionId);
  }
}
