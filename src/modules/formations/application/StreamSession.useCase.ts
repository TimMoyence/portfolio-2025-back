import {
  Inject,
  Injectable,
  Logger,
  MessageEvent,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GetSessionResultsUseCase } from './GetSessionResults.useCase';
import { SessionStreamLimitError } from '../domain/errors/FormationErrors';
import type { IAnswersRepository } from '../domain/IAnswers.repository';
import type {
  IStreamCapacity,
  StreamCapacityLease,
} from '../domain/IStreamCapacity.port';
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
  STREAM_CAPACITY,
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

type Fermeture = () => void;

const CAPACITE_MEMOIRE: IStreamCapacity = {
  acquire: () => Promise.resolve(null),
  refresh: () => Promise.resolve(),
  release: () => Promise.resolve(),
};

interface Place {
  readonly occupants: Map<string, Fermeture[]>;
  readonly cle: string;
  readonly plafond: number;
  readonly capacite: string;
}

interface PlacesDuFlux {
  readonly porteur: Place;
  readonly seance?: Place;
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
 *
 * Au-dela de ses places, un porteur (participant ou formateur) voit son plus
 * ancien flux clos sans evenement `fin` : une socket a demi ouverte n est
 * detectee morte qu apres l echec des battements (jusqu a quinze minutes
 * sous Linux), et le front (cours/runtime/core/sync.ts) cesse de se
 * reconnecter apres `fin` mais relance un flux simplement termine.
 */
@Injectable()
export class StreamSessionUseCase {
  private readonly logger = new Logger(StreamSessionUseCase.name);
  private readonly fluxEtudiants = new Map<string, Fermeture[]>();
  private readonly fluxFormateur = new Map<string, Fermeture[]>();
  private readonly fluxParParticipant = new Map<string, Fermeture[]>();

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
    @Optional()
    @Inject(STREAM_CAPACITY)
    private readonly capacity: IStreamCapacity = CAPACITE_MEMOIRE,
    @Optional()
    private readonly presenterResults?: GetSessionResultsUseCase,
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
      {
        porteur: {
          occupants: this.fluxFormateur,
          cle: sessionId,
          plafond: MAX_FLUX_FORMATEUR_PAR_SESSION,
          capacite: `teacher:${sessionId}`,
        },
      },
      session.bareme.questions.map((question) => question.id),
      teacherId,
    );
  }

  execute(sessionId: string, participantId: string): Observable<MessageEvent> {
    return this.ouvrirFlux(sessionId, {
      porteur: {
        occupants: this.fluxParParticipant,
        cle: participantId,
        plafond: MAX_FLUX_PAR_PARTICIPANT,
        capacite: `participant:${participantId}`,
      },
      seance: {
        occupants: this.fluxEtudiants,
        cle: sessionId,
        plafond: MAX_ABONNEMENTS_PAR_SESSION,
        capacite: `session:${sessionId}`,
      },
    });
  }

  private ouvrirFlux(
    sessionId: string,
    places: PlacesDuFlux,
    questionsDuFormateur?: readonly string[],
    teacherId?: string,
  ): Observable<MessageEvent> {
    assertSeanceDisponible(places);
    return new Observable<MessageEvent>((subscriber) => {
      let derniereEmpreinte = '';
      let derniereActivite = AUCUNE_ACTIVITE_VUE;
      let actif = true;
      let occupe = false;
      let bail: StreamCapacityLease | null = null;
      let boucle: ReturnType<typeof setInterval> | undefined;
      let battement: ReturnType<typeof setInterval> | undefined;
      let limite: ReturnType<typeof setTimeout> | undefined;

      const libererCapacite = (): void => {
        const aLiberer = bail;
        bail = null;
        if (aLiberer !== null) {
          void this.capacity.release(aLiberer).catch((error: unknown) => {
            this.logger.warn(
              `Bail de flux non libere pour la session ${sessionId}: ${messageDe(error)}`,
            );
          });
        }
      };

      const arreter = (): void => {
        actif = false;
        if (boucle !== undefined) clearInterval(boucle);
        if (battement !== undefined) clearInterval(battement);
        if (limite !== undefined) clearTimeout(limite);
        libererCapacite();
      };

      const ceder = (): void => {
        subscriber.complete();
        arreter();
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
          data: await this.lireResultats(sessionId, questionIds, teacherId),
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

      const demande = {
        places: [places.porteur, places.seance]
          .filter((place): place is Place => place !== undefined)
          .map(({ capacite, plafond }) => ({ key: capacite, limit: plafond })),
      };

      const demarrer = async (): Promise<void> => {
        try {
          bail = await this.capacity.acquire(demande);
          if (!actif) {
            arreter();
            return;
          }
          boucle = setInterval(() => {
            void tick();
          }, INTERVALLE_MS);

          battement = setInterval(() => {
            if (bail !== null) {
              this.rafraichirCapacite(bail, sessionId);
            }
            subscriber.next({
              type: 'heartbeat',
              data: { ts: new Date().toISOString() },
            });
          }, this.cadences.battementMs);

          limite = setTimeout(() => {
            subscriber.next({ type: 'fin', data: { raison: 'expiree' } });
            subscriber.complete();
            arreter();
          }, this.cadences.dureeMaxMs);

          fermerLesPlusAnciens(places.porteur);
          occuper(places, ceder);
          void tick();
        } catch (error) {
          this.logger.warn(
            `Ouverture du plafond de flux refusee pour la session ${sessionId}: ${messageDe(error)}`,
          );
          subscriber.error(new SessionStreamLimitError());
          arreter();
        }
      };

      void demarrer();

      return () => {
        liberer(places, ceder);
        arreter();
      };
    });
  }

  private async lireResultats(
    sessionId: string,
    questionIds: readonly string[],
    teacherId?: string,
  ): Promise<ResultatsSeance | Record<string, unknown>> {
    if (teacherId !== undefined && this.presenterResults !== undefined) {
      const rapport = await this.presenterResults.execute(sessionId, teacherId);
      return {
        ...rapport.resultats,
        statistiques: rapport.statistiques,
      };
    }
    const [answers, participants] = await Promise.all([
      this.answers.listBySession(sessionId),
      this.participants.countBySession(sessionId),
    ]);
    return agregerResultats({ questionIds, answers, participants });
  }

  private rafraichirCapacite(
    bail: StreamCapacityLease,
    sessionId: string,
  ): void {
    void this.capacity.refresh(bail).catch((error: unknown) => {
      this.logger.warn(
        `Bail de flux non renouvele pour la session ${sessionId}: ${messageDe(error)}`,
      );
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

function messageDe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function occupantsDe(place: Place): readonly Fermeture[] {
  return place.occupants.get(place.cle) ?? [];
}

function estPleine(place: Place): boolean {
  return occupantsDe(place).length >= place.plafond;
}

function assertSeanceDisponible({ porteur, seance }: PlacesDuFlux): void {
  if (seance && estPleine(seance) && !estPleine(porteur)) {
    throw new SessionStreamLimitError();
  }
}

function fermerLesPlusAnciens(porteur: Place): void {
  const occupants = occupantsDe(porteur);
  const enTrop = Math.max(0, occupants.length - porteur.plafond + 1);
  occupants.slice(0, enTrop).forEach((fermer) => fermer());
}

function occuper(places: PlacesDuFlux, fermeture: Fermeture): void {
  [places.porteur, places.seance].forEach((place) => {
    if (place) {
      place.occupants.set(place.cle, [...occupantsDe(place), fermeture]);
    }
  });
}

function liberer(places: PlacesDuFlux, fermeture: Fermeture): void {
  [places.porteur, places.seance].forEach((place) => {
    if (!place) {
      return;
    }
    const restants = occupantsDe(place).filter(
      (occupant) => occupant !== fermeture,
    );
    if (restants.length === 0) {
      place.occupants.delete(place.cle);
      return;
    }
    place.occupants.set(place.cle, restants);
  });
}
