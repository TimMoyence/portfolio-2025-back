import { Injectable } from '@nestjs/common';
import type { SessionRecord } from '../domain/ISessions.repository';
import { ActionSurUnParticipant } from './ActionSurUnParticipant';

@Injectable()
export class ReadmettreParticipantUseCase extends ActionSurUnParticipant {
  protected agir(
    session: SessionRecord,
    participantId: string,
  ): Promise<boolean> {
    return this.participants.readmettre(
      session.id,
      participantId,
      session.capacite,
    );
  }
}
