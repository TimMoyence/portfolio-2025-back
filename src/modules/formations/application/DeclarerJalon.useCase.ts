import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { EtatPulse } from '../domain/contrats/pilotage';
import { cleDeJalon } from '../domain/cours/CleDeJalon';
import { assertEcranServi } from '../domain/cours/EcranServi';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { ecranDeJalon } from '../domain/cours/Jalons';
import {
  CoursInconnuError,
  SessionNotFoundError,
} from '../domain/errors/FormationErrors';
import type { IPulsesRepository } from '../domain/IPulses.repository';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { assertReponsesOuvertes } from '../domain/SessionState';
import {
  CATALOGUE_COURS,
  PULSES_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

export interface DeclarerJalonCommand {
  readonly sessionId: string;
  readonly participantId: string;
  readonly sondageId: string;
  readonly etat: EtatPulse;
}

@Injectable()
export class DeclarerJalonUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(PULSES_REPOSITORY)
    private readonly pulses: IPulsesRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(CATALOGUE_COURS)
    private readonly catalogue: ICatalogueCours,
  ) {}

  async execute(command: DeclarerJalonCommand): Promise<void> {
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
    const cible = ecranDeJalon(cours, command.sondageId);
    if (cible === null) {
      throw new DomainValidationError(
        `Sondage absent du cours de cette séance : ${command.sondageId}`,
      );
    }
    assertEcranServi(session, cible.rang, cible.screenId, cours.ecrans.length);

    await this.pulses.declarer({
      sessionId: command.sessionId,
      cleParticipant: cleDeJalon(command.sessionId, command.participantId),
      sondageId: command.sondageId,
      etat: command.etat,
    });
    this.cache.signalerActivite(command.sessionId);
  }
}
