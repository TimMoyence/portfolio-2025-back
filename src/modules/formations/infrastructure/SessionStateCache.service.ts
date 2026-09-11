import { Injectable } from '@nestjs/common';
import type {
  ISessionStateCache,
  LiveSessionState,
} from '../domain/ISessionStateCache.port';

@Injectable()
export class SessionStateCacheService implements ISessionStateCache {
  private readonly etats = new Map<string, LiveSessionState>();

  publish(sessionId: string, state: LiveSessionState): void {
    this.etats.set(sessionId, state);
  }

  read(sessionId: string): LiveSessionState | null {
    return this.etats.get(sessionId) ?? null;
  }

  drop(sessionId: string): void {
    this.etats.delete(sessionId);
  }

  fingerprint(state: LiveSessionState): string {
    const intervalle = state.intervalleLibre
      ? `${state.intervalleLibre.premier}-${state.intervalleLibre.dernier}`
      : 'null';
    return [
      state.etat,
      state.modeRythme,
      state.ecranCourant,
      intervalle,
      state.participants,
    ].join('|');
  }
}
