import {
  Inject,
  Injectable,
  Logger,
  MessageEvent,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
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
export const MAX_FLUX_FORMATEUR_PAR_SESSION = 4;
export const MAX_FLUX_PAR_PARTICIPANT = 2;

export interface CadencesFlux {
  battementMs: number;
  dureeMaxMs: number;
}

export const CADENCES_PRODUCTION: CadencesFlux = {
  battementMs: HEARTBEAT_MS,
  dureeMaxMs: DUREE_MAX_MS,
};

interface Place {
  readonly occupees: Map<string, number>;
  readonly cle: string;
  readonly plafond: number;
}

/**
 * Chaque abonnement tient trois minuteurs et une socket pendant cinq heures
 * dans le processus partage par tout le site : sans plafond, une boucle
 * d EventSource sur un `sessionId` — rendu en clair a chaque inscription
 * (join-session.response.dto.ts) — suffit a le saturer.
 *
 * Trois budgets, comptes a part : cent flux etudiants par seance (trois fois
 * une classe, rechargements compris), deux flux simultanes par participant,
 * et quatre places reservees au formateur proprietaire (pupitre, scene et
 * leurs reconnexions), que les flux etudiants ne peuvent pas occuper. Le
 * throttler de FormationsStudent.controller.ts borne les ouvertures par
 * minute, pas les flux tenus ouverts.
 */
@Injectable()
export class StreamSessionUseCase {
  private readonly logger = new Logger(StreamSessionUseCase.name);
  private readonly fluxEtudiants = new Map<string, number>();
  private readonly fluxFormateur = new Map<string, number>();
  private readonly fluxParParticipant = new Map<string, number>();

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

  async executeForTeacher(
    sessionId: string,
    teacherId: string,
  ): Promise<Observable<MessageEvent>> {
    const session = assertSessionOwnedBy(
      await this.sessions.findById(sessionId),
      sessionId,
      teacherId,
    );
    return this.ouvrirFlux(
      sessionId,
      [
        {
          occupees: this.fluxFormateur,
          cle: sessionId,
          plafond: MAX_FLUX_FORMATEUR_PAR_SESSION,
        },
      ],
      session.bareme.questions.map((question) => question.id),
    );
  }

  execute(sessionId: string, participantId: string): Observable<MessageEvent> {
    return this.ouvrirFlux(sessionId, [
      {
        occupees: this.fluxEtudiants,
        cle: sessionId,
        plafond: MAX_ABONNEMENTS_PAR_SESSION,
      },
      {
        occupees: this.fluxParParticipant,
        cle: participantId,
        plafond: MAX_FLUX_PAR_PARTICIPANT,
      },
    ]);
  }

  private ouvrirFlux(
    sessionId: string,
    places: readonly Place[],
    questionsDuFormateur?: readonly string[],
  ): Observable<MessageEvent> {
    assertPlacesDisponibles(places);
    return new Observable<MessageEvent>((subscriber) => {
      places.forEach(entrer);
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
        questionIds: readonly string[],
      ): Promise<void> => {
        const activite = this.cache.activite(sessionId);
        if (activite === derniereActivite) {
          return;
        }
        subscriber.next({
          type: 'resultats',
          data: await this.lireResultats(sessionId, questionIds),
        });
        derniereActivite = activite;
      };

      const pousserResultatsDefinitifs = async (): Promise<void> => {
        if (!questionsDuFormateur) {
          return;
        }
        try {
          await pousserResultatsSiActivite(questionsDuFormateur);
        } catch (error) {
          this.logger.warn(
            `Resultats definitifs de la session ${sessionId} non pousses, le flux se clot quand meme: ${messageDe(error)}`,
          );
        }
      };

      const clore = async (): Promise<void> => {
        await pousserResultatsDefinitifs();
        subscriber.next({ type: 'fin', data: { raison: 'cloturee' } });
        subscriber.complete();
        this.cache.drop(sessionId);
        arreter();
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
          if (etat.etat === 'terminee') {
            await clore();
            return;
          }
          if (questionsDuFormateur) {
            await pousserResultatsSiActivite(questionsDuFormateur);
          }
        } catch (error) {
          this.logger.warn(
            `Passage du flux de la session ${sessionId} en echec, nouvel essai au passage suivant: ${messageDe(error)}`,
          );
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
        places.forEach(sortir);
        arreter();
      };
    });
  }

  private async lireResultats(
    sessionId: string,
    questionIds: readonly string[],
  ): Promise<ResultatsSeance> {
    const [answers, participants] = await Promise.all([
      this.answers.listBySession(sessionId),
      this.participants.countBySession(sessionId),
    ]);
    return agregerResultats({ questionIds, answers, participants });
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

function messageDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertPlacesDisponibles(places: readonly Place[]): void {
  if (
    places.some(
      (place) => (place.occupees.get(place.cle) ?? 0) >= place.plafond,
    )
  ) {
    throw new SessionStreamLimitError();
  }
}

function entrer(place: Place): void {
  place.occupees.set(place.cle, (place.occupees.get(place.cle) ?? 0) + 1);
}

function sortir(place: Place): void {
  const restantes = (place.occupees.get(place.cle) ?? 1) - 1;
  if (restantes <= 0) {
    place.occupees.delete(place.cle);
    return;
  }
  place.occupees.set(place.cle, restantes);
}
