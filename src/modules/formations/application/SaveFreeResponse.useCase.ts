import { Inject, Injectable } from '@nestjs/common';
import {
  activitesLibres,
  assertEcranServi,
  rangDeLEcran,
} from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import {
  assertEtapeNonCorrigee,
  assertPhaseOuverte,
} from '../domain/cours/PilotageEcrans';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import { ActiviteInconnueError } from '../domain/errors/FormationErrors';
import type {
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  CATALOGUE_COURS,
  FREE_RESPONSES_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';
import { coursDeLaSeance, seanceOuverteAuxReponses } from './CoursDeLaSeance';
import { participantActif } from './ParticipantActif';

@Injectable()
export class SaveFreeResponseUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async execute(command: SaveFreeResponseInput): Promise<void> {
    const response = texteRenseigne(command.response, 'La réponse');
    const session = await seanceOuverteAuxReponses(
      this.sessions,
      command.sessionId,
    );
    await participantActif(
      this.participants,
      command.sessionId,
      command.participantId,
    );
    const cours = await coursDeLaSeance(this.catalogue, session);
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
    assertPhaseOuverte(session.pilotageEcrans, { ecranId: command.screenId });
    assertEtapeNonCorrigee(
      session.pilotageEcrans,
      cours.ecrans.find((ecran) => ecran.id === command.screenId),
      command.activityId,
    );
    await this.freeResponses.save({ ...command, response });
    this.cache.signalerActivite(command.sessionId);
  }
}
