import { Inject, Injectable } from '@nestjs/common';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { PARTICIPANTS_REPOSITORY, SESSIONS_REPOSITORY } from '../domain/token';
import { agirSurUnParticipant } from './SessionAccess';

@Injectable()
export class LibererPosteUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
  ) {}

  execute(
    sessionId: string,
    teacherId: string,
    participantId: string,
  ): Promise<void> {
    return agirSurUnParticipant(
      this.sessions,
      { sessionId, teacherId, participantId },
      () => this.participants.libererPoste(sessionId, participantId),
    );
  }
}
