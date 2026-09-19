import { Inject, Injectable } from '@nestjs/common';
import { SessionNotFoundError } from '../domain/errors/FormationErrors';
import type {
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  FREE_RESPONSES_REPOSITORY,
  SESSIONS_REPOSITORY,
} from '../domain/token';

@Injectable()
export class SaveFreeResponseUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
  ) {}

  async execute(command: SaveFreeResponseInput): Promise<void> {
    const response = texteRenseigne(command.response, 'La réponse');
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);
    await this.freeResponses.save({ ...command, response });
  }
}
