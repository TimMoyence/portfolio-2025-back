import { Inject, Injectable } from '@nestjs/common';
import type {
  FreeResponseRecord,
  IFreeResponsesRepository,
} from '../domain/IFreeResponses.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import type { ActeurFormation } from '../domain/SessionOwnership';
import {
  FREE_RESPONSES_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { seanceLisiblePar } from './SessionAccess';

@Injectable()
export class ListFreeResponsesUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
  ) {}

  async execute(
    sessionId: string,
    acteur: ActeurFormation,
  ): Promise<readonly FreeResponseRecord[]> {
    await seanceLisiblePar(this.sessions, sessionId, acteur);
    return this.freeResponses.listBySession(sessionId);
  }
}
