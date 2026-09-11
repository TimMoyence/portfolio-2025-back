import { Inject, Injectable } from '@nestjs/common';
import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
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
import { SESSIONS_REPOSITORY } from '../domain/token';

@Injectable()
export class ControlSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
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
    await this.sessions.update(sessionId, { ecranCourant: ecran });
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
    await this.sessions.update(sessionId, {
      modeRythme: mode,
      intervalleLibre: mode === 'libre' ? intervalle : null,
    });
  }

  async start(sessionId: string, teacherId: string): Promise<void> {
    const session = await this.assertPilotable(sessionId, teacherId);
    if (!canTransition(session.etat, 'en_cours')) {
      throw new InvalidStateTransitionError(session.etat, 'en_cours');
    }
    await this.sessions.update(sessionId, { etat: 'en_cours' });
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
