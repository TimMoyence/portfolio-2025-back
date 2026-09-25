import { Inject, Injectable } from '@nestjs/common';
import type { Cours } from '../domain/contrats/cours';
import { assertEcranServi } from '../domain/cours/EcranServi';
import {
  ecranDeDefi,
  estRevele,
  strategiesPubliees,
} from '../domain/cours/Defis';
import type { EcranDeDefi, StrategiePubliee } from '../domain/cours/Defis';
import { assertPhaseOuverte } from '../domain/cours/PilotageEcrans';
import {
  DefiInconnuError,
  DefiSansTentativeError,
} from '../domain/errors/FormationErrors';
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { SessionRecord } from '../domain/ISessions.repository';
import { texteRenseigne } from '../domain/TexteRenseigne';
import { FREE_RESPONSES_REPOSITORY } from '../domain/token';
import { ParticipationEnSeance } from './ParticipationEnSeance';

export interface TentativeDeDefiCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly defiId: string;
  readonly texte: string;
  readonly dureeMs: number;
}

export interface StrategiesDeDefi {
  strategies: StrategiePubliee[];
}

function cibleServie(
  session: SessionRecord,
  cours: Cours,
  defiId: string,
): EcranDeDefi {
  const cible = ecranDeDefi(cours, defiId);
  if (cible === null) {
    throw new DefiInconnuError(defiId);
  }
  assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);
  return cible;
}

@Injectable()
export class DefisUseCase {
  constructor(
    private readonly participation: ParticipationEnSeance,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
  ) {}

  async tenter(command: TentativeDeDefiCommand): Promise<StrategiesDeDefi> {
    const texte = texteRenseigne(command.texte, 'La tentative');
    const { session, cours } = await this.participation.ouverte(command);
    const cible = cibleServie(session, cours, command.defiId);
    assertPhaseOuverte(session.pilotageEcrans, { ecranId: cible.ecran.id });

    await this.freeResponses.enregistrerTentativeDeDefi({
      sessionId: command.sessionId,
      participantId: command.participantId,
      screenId: cible.ecran.id,
      activityId: command.defiId,
      response: texte,
      dureeMs: command.dureeMs,
    });
    this.participation.signalerActivite(command.sessionId);

    return { strategies: [...strategiesPubliees(cible, false)] };
  }

  async strategies(
    sessionId: string,
    participantId: string,
    defiId: string,
  ): Promise<StrategiesDeDefi> {
    const { session, cours } = await this.participation.contexte({
      sessionId,
      participantId,
    });
    const cible = cibleServie(session, cours, defiId);
    const tentative = await this.freeResponses.trouverParActivite(
      participantId,
      defiId,
    );
    if (tentative === null) {
      throw new DefiSansTentativeError(defiId);
    }
    return {
      strategies: [
        ...strategiesPubliees(
          cible,
          estRevele(session.pilotageEcrans, cible.ecran.id),
        ),
      ],
    };
  }
}
