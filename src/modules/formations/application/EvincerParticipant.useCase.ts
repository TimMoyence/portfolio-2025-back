import { Injectable } from '@nestjs/common';
import type { SessionRecord } from '../domain/ISessions.repository';
import { ActionSurUnParticipant } from './ActionSurUnParticipant';

@Injectable()
export class EvincerParticipantUseCase extends ActionSurUnParticipant {
  protected agir(
    session: SessionRecord,
    participantId: string,
  ): Promise<boolean> {
    return this.participation.participants.evincer(session.id, participantId);
  }
}
