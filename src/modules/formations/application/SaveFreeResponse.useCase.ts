import { Inject, Injectable } from '@nestjs/common';
import {
  activitesLibres,
  assertEcranServi,
  rangDeLEcran,
} from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import {
  ActiviteInconnueError,
  CoursInconnuError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type {
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  CATALOGUE_COURS,
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
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(command: SaveFreeResponseInput): Promise<void> {
    const response = texteRenseigne(command.response, 'La réponse');
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    assertEcranServi(
      session,
      rangDeLEcran(cours, command.screenId),
      command.screenId,
      cours.ecrans.length,
    );
    const admises = activitesLibres(cours).get(command.screenId) ?? [];
    if (!admises.includes(command.activityId)) {
      throw new ActiviteInconnueError(command.screenId, command.activityId);
    }
    await this.freeResponses.save({ ...command, response });
  }
}
