import { Injectable } from '@nestjs/common';
import type {
  ISessionStateCache,
  LiveSessionState,
} from '../../domain/seance/etat/ISessionStateCache.port';

@Injectable()
export class SessionStateCacheService implements ISessionStateCache {
  private readonly etats = new Map<string, LiveSessionState>();
  private readonly activites = new Map<string, number>();
  private readonly planchersDeRevision = new Map<string, number>();

  publish(sessionId: string, state: LiveSessionState): void {
    if (state.revision >= this.plancherDe(sessionId)) {
      this.etats.set(sessionId, state);
    }
  }

  read(sessionId: string): LiveSessionState | null {
    return this.etats.get(sessionId) ?? null;
  }

  drop(sessionId: string, revisionDuRetrait: number): void {
    this.planchersDeRevision.set(
      sessionId,
      Math.max(revisionDuRetrait, this.plancherDe(sessionId)),
    );
    this.etats.delete(sessionId);
    this.activites.delete(sessionId);
  }

  private plancherDe(sessionId: string): number {
    return (
      this.read(sessionId)?.revision ??
      this.planchersDeRevision.get(sessionId) ??
      0
    );
  }

  signalerActivite(sessionId: string): void {
    this.activites.set(sessionId, this.activite(sessionId) + 1);
  }

  activite(sessionId: string): number {
    return this.activites.get(sessionId) ?? 0;
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
      state.revision,
    ].join('|');
  }
}
