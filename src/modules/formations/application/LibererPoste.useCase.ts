import { Injectable } from '@nestjs/common';
import type { SessionRecord } from '../domain/ISessions.repository';
import { ActionSurUnParticipant } from './ActionSurUnParticipant';

@Injectable()
export class LibererPosteUseCase extends ActionSurUnParticipant {
  protected agir(
    session: SessionRecord,
    participantId: string,
  ): Promise<boolean> {
    return this.participation.participants.libererPoste(
      session.id,
      participantId,
    );
  }
}
