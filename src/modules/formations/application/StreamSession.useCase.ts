import { Inject, Injectable, MessageEvent, Optional } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Bareme } from '../domain/Bareme';
import { SessionStreamLimitError } from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type { IParticipantsRepository } from '../domain/IParticipants.repository';
import type {
  ISessionStateCache,
  LiveSessionState,
} from '../domain/ISessionStateCache.port';
import type { ISessionsRepository } from '../domain/ISessions.repository';
import { agregerResultats } from '../domain/ResultatsSeance';
import type { ResultatsSeance } from '../domain/ResultatsSeance';
import { assertSessionOwnedBy } from '../domain/SessionOwnership';
import {
  ANSWERS_REPOSITORY,
  PARTICIPANTS_REPOSITORY,
  SESSION_STATE_CACHE,
  SESSIONS_REPOSITORY,
} from '../domain/token';

const INTERVALLE_MS = 500;
const HEARTBEAT_MS = 15000;
const DUREE_MAX_MS = 5 * 60 * 60 * 1000;
const AUCUNE_ACTIVITE_VUE = -1;
export const MAX_ABONNEMENTS_PAR_SESSION = 100;

export interface CadencesFlux {
  battementMs: number;
  dureeMaxMs: number;
}

export const CADENCES_PRODUCTION: CadencesFlux = {
  battementMs: HEARTBEAT_MS,
  dureeMaxMs: DUREE_MAX_MS,
};

@Injectable()
export class StreamSessionUseCase {
  private readonly abonnements = new Map<string, number>();

  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessions: ISessionsRepository,
    @Inject(SESSION_STATE_CACHE)
    private readonly cache: ISessionStateCache,
    @Inject(ANSWERS_REPOSITORY)
    private readonly answers: IAnswersRepository,
    @Inject(PARTICIPANTS_REPOSITORY)
    private readonly participants: IParticipantsRepository,
    @Optional()
    private readonly cadences: CadencesFlux = CADENCES_PRODUCTION,
  ) {}

  /**
   * Chaque abonnement tient trois minuteurs et une socket pendant cinq
   * heures dans le processus partage par tout le site : sans plafond, une
   * boucle d EventSource sur un `sessionId` — rendu en clair a chaque
   * inscription (join-session.response.dto.ts) — suffit a le saturer.
   * Cent places couvrent trois fois une classe, rechargements compris.
   */
  async executeForTeacher(
    sessionId: string,
    teacherId: string,
  ): Promise<Observable<MessageEvent>> {
    const session = assertSessionOwnedBy(
      await this.sessions.findById(sessionId),
      sessionId,
      teacherId,
    );
    return this.ouvrirFlux(sessionId, session.bareme);
  }

  execute(sessionId: string): Observable<MessageEvent> {
    return this.ouvrirFlux(sessionId);
  }

  private ouvrirFlux(
    sessionId: string,
    baremeDuFormateur?: Bareme,
  ): Observable<MessageEvent> {
    this.assertPlaceDisponible(sessionId);
    return new Observable<MessageEvent>((subscriber) => {
      this.entrer(sessionId);
      let derniereEmpreinte = '';
      let derniereActivite = AUCUNE_ACTIVITE_VUE;
      let actif = true;
      let occupe = false;

      const arreter = (): void => {
        actif = false;
        clearInterval(boucle);
        clearInterval(battement);
        clearTimeout(limite);
      };

      const pousserResultatsSiActivite = async (
        bareme: Bareme,
      ): Promise<void> => {
        const activite = this.cache.activite(sessionId);
        if (activite === derniereActivite) {
          return;
        }
        subscriber.next({
          type: 'resultats',
          data: await this.lireResultats(sessionId, bareme),
        });
        derniereActivite = activite;
      };

      const tick = async (): Promise<void> => {
        if (!actif || occupe) {
          return;
        }
        occupe = true;
        try {
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
          if (baremeDuFormateur) {
            await pousserResultatsSiActivite(baremeDuFormateur);
          }
          if (etat.etat === 'terminee') {
            subscriber.next({ type: 'fin', data: { raison: 'cloturee' } });
            subscriber.complete();
            this.cache.drop(sessionId);
            arreter();
          }
        } finally {
          occupe = false;
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
      }, this.cadences.battementMs);

      const limite = setTimeout(() => {
        subscriber.next({ type: 'fin', data: { raison: 'expiree' } });
        subscriber.complete();
        arreter();
      }, this.cadences.dureeMaxMs);

      void tick();

      return () => {
        this.sortir(sessionId);
        arreter();
      };
    });
  }

  private assertPlaceDisponible(sessionId: string): void {
    if ((this.abonnements.get(sessionId) ?? 0) >= MAX_ABONNEMENTS_PAR_SESSION) {
      throw new SessionStreamLimitError();
    }
  }

  private entrer(sessionId: string): void {
    this.abonnements.set(sessionId, (this.abonnements.get(sessionId) ?? 0) + 1);
  }

  private sortir(sessionId: string): void {
    const restants = (this.abonnements.get(sessionId) ?? 1) - 1;
    if (restants <= 0) {
      this.abonnements.delete(sessionId);
      return;
    }
    this.abonnements.set(sessionId, restants);
  }

  private async lireResultats(
    sessionId: string,
    bareme: Bareme,
  ): Promise<ResultatsSeance> {
    const [answers, participants] = await Promise.all([
      this.answers.listBySession(sessionId),
      this.participants.listBySession(sessionId),
    ]);
    return agregerResultats({ bareme, answers, participants });
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
