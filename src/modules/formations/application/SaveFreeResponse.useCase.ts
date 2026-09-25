import { Inject, Injectable } from '@nestjs/common';
import {
  activitesLibres,
  assertEcranServi,
  rangDeLEcran,
} from '../domain/cours/EcranServi';
import {
  assertEtapeNonCorrigee,
  assertPhaseOuverte,
} from '../domain/cours/PilotageEcrans';
import { ActiviteInconnueError } from '../domain/errors/FormationErrors';
import type {
  IFreeResponsesRepository,
  SaveFreeResponseInput,
} from '../domain/IFreeResponses.repository';
import { texteRenseigne } from '../domain/TexteRenseigne';
import { FREE_RESPONSES_REPOSITORY } from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';

@Injectable()
export class SaveFreeResponseUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
  ) {}

  async execute(command: SaveFreeResponseInput): Promise<void> {
    const response = texteRenseigne(command.response, 'La réponse');
    const { session, cours } = await this.participation.ouverte(command);
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
    this.participation.signalerActivite(command.sessionId);
  }
}
