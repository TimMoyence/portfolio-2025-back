import { Injectable } from '@nestjs/common';
import type { SessionRecord } from '../domain/ISessions.repository';
import { ParticipationEnSeance } from './ParticipationEnSeance';
import { agirSurUnParticipant } from './SessionAccess';

@Injectable()
export abstract class ActionSurUnParticipant {
  constructor(protected readonly participation: ParticipationEnSeance) {}

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
      this.participation.sessions,
      { sessionId, teacherId, participantId },
      (session) => this.agir(session, participantId),
    );
    this.participation.signalerActivite(sessionId);
  }
}
