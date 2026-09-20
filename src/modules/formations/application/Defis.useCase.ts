import { Inject, Injectable } from '@nestjs/common';
import { assertEcranServi } from '../domain/cours/EcranServi';
import {
  ecranDeDefi,
  estRevele,
  strategiesPubliees,
} from '../domain/cours/Defis';
import type { EcranDeDefi, StrategiePubliee } from '../domain/cours/Defis';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import {
  CoursInconnuError,
  DefiInconnuError,
  DefiSansTentativeError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IFreeResponsesRepository } from '../domain/IFreeResponses.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import { texteRenseigne } from '../domain/TexteRenseigne';
import {
  CATALOGUE_COURS,
  FREE_RESPONSES_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

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

@Injectable()
export class DefisUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(FREE_RESPONSES_REPOSITORY)
    private readonly freeResponses: IFreeResponsesRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async tenter(command: TentativeDeDefiCommand): Promise<StrategiesDeDefi> {
    const texte = texteRenseigne(command.texte, 'La tentative');
    const session = await this.sessions.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }
    assertReponsesOuvertes(session.etat);
    const cible = await this.cibleServie(session, command.defiId);

    await this.freeResponses.enregistrerTentativeDeDefi({
      sessionId: command.sessionId,
      participantId: command.participantId,
      screenId: cible.ecran.id,
      activityId: command.defiId,
      response: texte,
      dureeMs: command.dureeMs,
    });
    this.cache.signalerActivite(command.sessionId);

    return {
      strategies: [
        ...strategiesPubliees(
          cible,
          estRevele(session.pilotageEcrans, cible.ecran.id),
        ),
      ],
    };
  }

  async strategies(
    sessionId: string,
    participantId: string,
    defiId: string,
  ): Promise<StrategiesDeDefi> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    const cible = await this.cibleServie(session, defiId);
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

  private async cibleServie(
    session: SessionRecord,
    defiId: string,
  ): Promise<EcranDeDefi> {
    const cours = await this.catalogue.trouver(
      session.courseSlug,
      session.courseVersion,
    );
    if (!cours) {
      throw new CoursInconnuError(session.courseSlug);
    }
    const cible = ecranDeDefi(cours, defiId);
    if (cible === null) {
      throw new DefiInconnuError(defiId);
    }
    assertEcranServi(session, cible.rang, cible.ecran.id, cours.ecrans.length);
    return cible;
  }
}
