import { Inject, Injectable } from '@nestjs/common';
import {
  activitesLibres,
  cibleServie,
  ecranParId,
} from '../domain/cours/EcranServi';
import {
  assertEtapeNonCorrigee,
  assertPhaseOuverte,
} from '../domain/cours/PilotageEcrans';
import {
  ActiviteInconnueError,
  EcranNonServiError,
} from '../domain/errors/FormationErrors';
import type {
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import { texteRenseigne } from '../domain/TexteRenseigne';
import { FREE_RESPONSES_REPOSITORY } from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';

const CHAMP = 'La réponse';

@Injectable()
export class SaveFreeResponseUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
  ) {}

  async execute(command: SaveFreeResponseInput): Promise<void> {
    const response = texteRenseigne(command.response, CHAMP);
    const { session, cours } = await this.participation.ouverte(command);
    const ecran = cibleServie(
      session,
      cours,
      {
        valeur: ecranParId(cours, command.screenId) ?? null,
        id: command.screenId,
        rang: (servi) => cours.ecrans.indexOf(servi),
      },
      (screenId) => new EcranNonServiError(screenId),
    );
    const admises = activitesLibres(cours).get(command.screenId) ?? [];
    if (!admises.includes(command.activityId)) {
      throw new ActiviteInconnueError(command.screenId, command.activityId);
    }
    assertPhaseOuverte(session.pilotageEcrans, { ecranId: command.screenId });
    assertEtapeNonCorrigee(session.pilotageEcrans, ecran, command.activityId);
    await this.freeResponses.save({ ...command, response });
    this.participation.signalerActivite(command.sessionId);
  }
}
