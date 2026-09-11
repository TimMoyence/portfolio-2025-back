import { Inject, Injectable, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type {
  ISessionStateCache,
  LiveSessionState,
} from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { SESSION_STATE_CACHE, SESSIONS_REPOSITORY } from '../domain/token';

const INTERVALLE_MS = 500;
const HEARTBEAT_MS = 15000;
const DUREE_MAX_MS = 5 * 60 * 60 * 1000;

@Injectable()
export class StreamSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
  ) {}

  execute(sessionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let derniereEmpreinte = '';
      let actif = true;

      const arreter = (): void => {
        actif = false;
        clearInterval(boucle);
        clearInterval(battement);
        clearTimeout(limite);
      };

      const tick = async (): Promise<void> => {
        if (!actif) {
          return;
        }
        const etat = await this.resolveState(sessionId);
        if (!etat) {
          subscriber.next({ type: 'fin', data: { raison: 'introuvable' } });
          subscriber.complete();
          arreter();
          return;
        }
        const empreinte = this.cache.fingerprint(etat);
        if (empreinte !== derniereEmpreinte) {
          derniereEmpreinte = empreinte;
          subscriber.next({ type: 'etat', data: etat });
        }
        if (etat.etat === 'terminee') {
          subscriber.next({ type: 'fin', data: { raison: 'cloturee' } });
          subscriber.complete();
          arreter();
        }
      };

      const boucle = setInterval(() => {
        void tick();
      }, INTERVALLE_MS);

      const battement = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: { ts: new Date().toISOString() },
        });
      }, HEARTBEAT_MS);

      const limite = setTimeout(() => {
        subscriber.next({ type: 'fin', data: { raison: 'expiree' } });
        subscriber.complete();
        arreter();
      }, DUREE_MAX_MS);

      void tick();

      return () => {
        arreter();
      };
    });
  }

  private async resolveState(
    sessionId: string,
  ): Promise<LiveSessionState | null> {
    const enCache = this.cache.read(sessionId);
    if (enCache) {
      return enCache;
    }
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      return null;
    }
    const etat: LiveSessionState = {
      etat: session.etat,
      modeRythme: session.modeRythme,
      ecranCourant: session.ecranCourant,
      intervalleLibre: session.intervalleLibre,
      participants: 0,
      majLe: session.majLe,
    };
    this.cache.publish(sessionId, etat);
    return etat;
  }
}
