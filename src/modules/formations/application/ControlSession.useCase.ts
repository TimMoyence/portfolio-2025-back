import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { ISessionStateCache } from '../domain/ISessionStateCache.port';
import type {
  ISessionsRepository,
  SessionRecord,
} from '../domain/ISessions.repository';
import {
  InvalidStateTransitionError,
  SessionClosedError,
  SessionNotFoundError,
  SessionNotOwnedError,
} from '../domain/errors/FormationErrors';
import { isFreeRangeValid } from '../domain/PacingMode';
import type { FreeRange, PacingMode } from '../domain/PacingMode';
import { canTransition } from '../domain/SessionState';
import { SESSION_STATE_CACHE, SESSIONS_REPOSITORY } from '../domain/token';

@Injectable()
export class ControlSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  async setScreen(
    sessionId: string,
    teacherId: string,
    ecran: number,
  ): Promise<void> {
    if (!Number.isInteger(ecran) || ecran < 0) {
      throw new DomainValidationError(`Numero d ecran invalide: ${ecran}`);
    }
    await this.assertPilotable(sessionId, teacherId);
    const session = await this.sessions.update(sessionId, {
      ecranCourant: ecran,
    });
    this.publier(sessionId, session);
  }

  async setPacing(
    sessionId: string,
    teacherId: string,
    mode: PacingMode,
    intervalle: FreeRange | null,
  ): Promise<void> {
    if (
      mode === 'libre' &&
      (intervalle === null || !isFreeRangeValid(intervalle))
    ) {
      throw new DomainValidationError('Intervalle de rythme libre invalide');
    }
    await this.assertPilotable(sessionId, teacherId);
    const session = await this.sessions.update(sessionId, {
      modeRythme: mode,
      intervalleLibre: mode === 'libre' ? intervalle : null,
    });
    this.publier(sessionId, session);
  }

  async start(sessionId: string, teacherId: string): Promise<void> {
    const session = await this.assertPilotable(sessionId, teacherId);
    if (!canTransition(session.etat, 'en_cours')) {
      throw new InvalidStateTransitionError(session.etat, 'en_cours');
    }
    const misAJour = await this.sessions.update(sessionId, {
      etat: 'en_cours',
    });
    this.publier(sessionId, misAJour);
  }

  private publier(sessionId: string, session: SessionRecord): void {
    const enCache = this.cache.read(sessionId);
    this.cache.publish(sessionId, {
      etat: session.etat,
      modeRythme: session.modeRythme,
      ecranCourant: session.ecranCourant,
      intervalleLibre: session.intervalleLibre,
      participants: enCache?.participants ?? 0,
      majLe: session.majLe,
    });
  }

  private async assertPilotable(
    sessionId: string,
    teacherId: string,
  ): Promise<SessionRecord> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    if (session.teacherId !== teacherId) {
      throw new SessionNotOwnedError(sessionId);
    }
    if (session.etat === 'terminee') {
      throw new SessionClosedError();
    }
    return session;
  }
}
