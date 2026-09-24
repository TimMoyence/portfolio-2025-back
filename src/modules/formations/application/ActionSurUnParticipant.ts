import { Inject } from '@nestjs/common';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import {
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { agirSurUnParticipant } from './SessionAccess';

export abstract class ActionSurUnParticipant {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    protected readonly participants: IParticipantsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  protected abstract agir(
    session: SessionRecord,
    participantId: string,
  ): Promise<boolean>;

  async execute(
    sessionId: string,
    teacherId: string,
    participantId: string,
  ): Promise<void> {
    await agirSurUnParticipant(
      this.sessions,
      { sessionId, teacherId, participantId },
      (session) => this.agir(session, participantId),
    );
    this.cache.signalerActivite(sessionId);
  }
}
