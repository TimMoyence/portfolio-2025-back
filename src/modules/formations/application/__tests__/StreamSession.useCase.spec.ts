/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import type { Observable, Subscription } from 'rxjs';
import { creerCatalogueDeTest } from '../../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  buildResultatQuestion,
  createMockEscapeRepo,
  createMockIncidentsRepo,
  createMockPulsesRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  PlafondDeFluxAtteintError,
  SessionNotOwnedError,
  SessionStreamLimitError,
} from '../../domain/errors/FormationErrors';
import type { AnswerRecord } from '../../domain/IAnswers.repository';
import type {
  IStreamCapacity,
  StreamCapacityLease,
  StreamCapacityRequest,
} from '../../domain/IStreamCapacity.port';
import type { ResultatsSeance } from '../../domain/ResultatsSeance';
import { SessionStateCacheService } from '../../infrastructure/SessionStateCache.service';
import { GetSessionResultsUseCase } from '../GetSessionResults.useCase';
import {
  CADENCES_PRODUCTION,
  MAX_ABONNEMENTS_PAR_SESSION,
  MAX_FLUX_FORMATEUR_PAR_SESSION,
  MAX_FLUX_PAR_PARTICIPANT,
  StreamSessionUseCase,
} from '../StreamSession.useCase';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_MS_TEST = 15000;
const INTERVALLE_MS_TEST = 500;
const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

function participantDeRang(rang: number): string {
  return `etudiant-${rang}`;
}

const REPONSE_FAUSSE = buildAnswerRecord({
  id: 'answer-fausse-uuid',
  participantId: 'participant-2-uuid',
  valeur: 1300,
  correcte: false,
  misconception: 'interet-simple',
});

interface Ecoute {
  readonly abonnement: Subscription;
  readonly evenements: MessageEvent[];
  resultats(): ResultatsSeance[];
  types(): string[];
  terminee(): boolean;
}

function ecouter(flux: Observable<MessageEvent>): Ecoute {
  const evenements: MessageEvent[] = [];
  let terminee = false;
  return {
    abonnement: flux.subscribe({
      next: (evenement) => evenements.push(evenement),
      complete: () => {
        terminee = true;
      },
    }),
    evenements,
    resultats: () =>
      evenements
        .filter((evenement) => evenement.type === 'resultats')
        .map((evenement) => evenement.data as ResultatsSeance),
    types: () => evenements.map((evenement) => String(evenement.type)),
    terminee: () => terminee,
  };
}

function capacitePartagee(): IStreamCapacity {
  const occupants = new Map<string, Map<string, number>>();
  let sequence = 0;
  return {
    acquire: (request: StreamCapacityRequest): Promise<StreamCapacityLease> => {
      if (
        request.places.some(({ key, limit }) => {
          const compte = occupants.get(key)?.size ?? 0;
          return compte >= limit;
        })
      ) {
        throw new PlafondDeFluxAtteintError(
          request.places.map(({ key }) => key).join(', '),
        );
      }
      const token = `bail-${sequence++}`;
      for (const { key } of request.places) {
        const places = occupants.get(key) ?? new Map<string, number>();
        places.set(token, 1);
        occupants.set(key, places);
      }
      return Promise.resolve({
        token,
        keys: request.places.map(({ key }) => key),
      });
    },
    refresh: () => Promise.resolve(),
    release: (lease: StreamCapacityLease) => {
      for (const key of lease.keys) {
        const places = occupants.get(key);
        places?.delete(lease.token);
        if (places?.size === 0) occupants.delete(key);
      }
      return Promise.resolve();
    },
  };
}

describe('StreamSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: SessionStateCacheService;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let resultats: GetSessionResultsUseCase;
  let sut: StreamSessionUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    sessions = createMockSessionsRepo();
    cache = new SessionStateCacheService();
    answers = createMockAnswersRepo();
    participants = createMockParticipantsRepo();
    resultats = new GetSessionResultsUseCase(
      sessions,
      participants,
      answers,
      createMockIncidentsRepo(),
      creerCatalogueDeTest(),
      createMockPulsesRepo(),
      createMockEscapeRepo(),
    );
    sut = new StreamSessionUseCase(sessions, cache, resultats);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emet l etat initial des la souscription', async () => {
    const premier = firstValueFrom(sut.execute('session-uuid', PARTICIPANT_ID));
    await jest.advanceTimersByTimeAsync(10);
    const message = await premier;
    expect(message.type).toBe('etat');
  });

  it('n emet pas deux fois le meme etat', async () => {
    const messages = firstValueFrom(
      sut.execute('session-uuid', PARTICIPANT_ID).pipe(take(2), toArray()),
    );
    await jest.advanceTimersByTimeAsync(HEARTBEAT_MS_TEST);
    const recus = await messages;
    expect(recus[1].type).toBe('heartbeat');
  });

  it('emet un nouvel etat quand l ecran change', async () => {
    const messages = firstValueFrom(
      sut.execute('session-uuid', PARTICIPANT_ID).pipe(take(2), toArray()),
    );
    await jest.advanceTimersByTimeAsync(100);
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ ecranCourant: 9 }),
    );
    cache.drop('session-uuid');
    await jest.advanceTimersByTimeAsync(HEARTBEAT_MS_TEST);
    const recus = await messages;
    expect(recus[1].type).toBe('etat');
    expect((recus[1].data as Record<string, unknown>)['ecranCourant']).toBe(9);
  });

  it('termine le flux quand la session est terminee', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    const messages = firstValueFrom(
      sut.execute('session-uuid', PARTICIPANT_ID).pipe(toArray()),
    );
    await jest.advanceTimersByTimeAsync(1000);
    const recus = await messages;
    expect(recus[recus.length - 1].type).toBe('fin');
  });

  it('vide le cache quand la session se termine', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    const subscription = sut
      .execute('session-uuid', PARTICIPANT_ID)
      .subscribe();
    await jest.advanceTimersByTimeAsync(10);
    expect(cache.read('session-uuid')).toBeNull();
    subscription.unsubscribe();
  });

  it('ne vide pas le cache quand un client se desabonne d une session active', async () => {
    const subscription = sut
      .execute('session-uuid', PARTICIPANT_ID)
      .subscribe();
    await jest.advanceTimersByTimeAsync(10);
    expect(cache.read('session-uuid')).not.toBeNull();
    subscription.unsubscribe();
    expect(cache.read('session-uuid')).not.toBeNull();
  });

  it('termine le flux quand la session est introuvable', async () => {
    sessions.findById.mockResolvedValue(null);
    const messages = firstValueFrom(
      sut.execute('session-uuid', PARTICIPANT_ID).pipe(toArray()),
    );
    await jest.advanceTimersByTimeAsync(10);
    const recus = await messages;
    expect(recus[recus.length - 1].type).toBe('fin');
  });

  describe('plafond partage indisponible (H6, AC-39)', () => {
    const fermerLesEcoutes = (ouverts: readonly Ecoute[]): void => {
      ouverts.forEach((ecoute) => ecoute.abonnement.unsubscribe());
    };

    const capaciteEnPanne = (): IStreamCapacity => ({
      acquire: () => Promise.reject(new Error('Redis indisponible')),
      refresh: () => Promise.resolve(),
      release: () => Promise.resolve(),
    });

    const capaciteAuPlafond = (): IStreamCapacity => ({
      acquire: () =>
        Promise.reject(new PlafondDeFluxAtteintError('session:session-uuid')),
      refresh: () => Promise.resolve(),
      release: () => Promise.resolve(),
    });

    const fluxAvec = (capacite: IStreamCapacity): StreamSessionUseCase =>
      new StreamSessionUseCase(
        sessions,
        new SessionStateCacheService(),
        resultats,
        undefined,
        capacite,
      );

    it('refuse le flux en 429 et journalise un avertissement quand le plafond est atteint', async () => {
      const avertir = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const erreur = new Promise<unknown>((resolve) => {
        fluxAvec(capaciteAuPlafond())
          .execute('session-uuid', PARTICIPANT_ID)
          .subscribe({ error: resolve });
      });
      await jest.advanceTimersByTimeAsync(10);

      await expect(erreur).resolves.toBeInstanceOf(SessionStreamLimitError);
      expect(avertir).toHaveBeenCalledWith(
        expect.stringContaining('Plafond de flux atteint'),
      );
      avertir.mockRestore();
    });

    it('ouvre le flux en mode degrade et journalise une erreur quand Redis tombe', async () => {
      const signaler = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const flux = ecouter(
        fluxAvec(capaciteEnPanne()).execute('session-uuid', PARTICIPANT_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(flux.types()).toContain('etat');
      expect(signaler).toHaveBeenCalledWith(
        expect.stringContaining('mode degrade'),
        expect.stringContaining('Redis indisponible'),
      );
      fermerLesEcoutes([flux]);
      signaler.mockRestore();
    });

    it('borne le mode degrade par les plafonds du processus', async () => {
      const sut = fluxAvec(capaciteEnPanne());
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const ouverts = Array.from(
        { length: MAX_ABONNEMENTS_PAR_SESSION },
        (_, rang) =>
          ecouter(sut.execute('session-uuid', participantDeRang(rang))),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(() =>
        sut.execute('session-uuid', 'participant-au-dela-du-plafond'),
      ).toThrow(SessionStreamLimitError);
      fermerLesEcoutes(ouverts);
      jest.restoreAllMocks();
    });
  });

  describe('budgets de flux simultanes', () => {
    const ouvrirFluxEtudiants = async (
      nombre: number,
      sessionId = 'session-uuid',
    ): Promise<Ecoute[]> => {
      const ouverts = Array.from({ length: nombre }, (_, rang) =>
        ecouter(sut.execute(sessionId, participantDeRang(rang))),
      );
      await jest.advanceTimersByTimeAsync(10);
      return ouverts;
    };

    const ouvrirFluxDuParticipant = async (
      nombre: number,
    ): Promise<Ecoute[]> => {
      const ouverts = Array.from({ length: nombre }, () =>
        ecouter(sut.execute('session-uuid', PARTICIPANT_ID)),
      );
      await jest.advanceTimersByTimeAsync(10);
      return ouverts;
    };

    const ouvrirFluxFormateur = async (nombre: number): Promise<Ecoute[]> => {
      const ouverts = await Promise.all(
        Array.from({ length: nombre }, async () =>
          ecouter(await sut.executeForTeacher('session-uuid', TEACHER_ID)),
        ),
      );
      await jest.advanceTimersByTimeAsync(10);
      return ouverts;
    };

    const fermer = (ouverts: readonly Ecoute[]): void => {
      ouverts.forEach((ecoute) => ecoute.abonnement.unsubscribe());
    };

    const terminees = (ouverts: readonly Ecoute[]): boolean[] =>
      ouverts.map((ecoute) => ecoute.terminee());

    const seulLePremierTermine = (nombre: number): boolean[] =>
      Array.from({ length: nombre }, (_, rang) => rang === 0);

    it('borne le nombre de flux etudiants simultanes sur une meme session', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(() =>
        sut.execute(
          'session-uuid',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).toThrow(SessionStreamLimitError);

      fermer(ouverts);
    });

    it('ne compte pas deux sessions distinctes dans le meme plafond', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(() =>
        sut.execute(
          'autre-session',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).not.toThrow();

      fermer(ouverts);
    });

    it('rend sa place au plafond quand un client se desabonne', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);
      ouverts[0].abonnement.unsubscribe();

      expect(() =>
        sut.execute(
          'session-uuid',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).not.toThrow();

      fermer(ouverts.slice(1));
    });

    it('ouvre le flux du formateur quand cent flux etudiants tiennent deja la session', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(ecoute.types()).toContain('etat');
      ecoute.abonnement.unsubscribe();
      fermer(ouverts);
    });

    it('reserve au formateur des places que ses flux ne prennent pas aux etudiants', async () => {
      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );

      const etudiants = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(terminees(formateur)).not.toContain(true);
      expect(terminees(etudiants)).not.toContain(true);
      fermer(formateur);
      fermer(etudiants);
    });

    it('clot sans evenement fin le plus ancien flux du formateur qui en ouvre un au-dela de ses places', async () => {
      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );

      const nouveau = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(formateur)).toEqual(
        seulLePremierTermine(MAX_FLUX_FORMATEUR_PAR_SESSION),
      );
      expect(formateur[0].types()).not.toContain('fin');
      expect(nouveau.types()).toContain('etat');
      expect(nouveau.terminee()).toBe(false);
      fermer([...formateur, nouveau]);
    });

    it('clot sans evenement fin le plus ancien flux d un participant qui en ouvre un au-dela de son plafond', async () => {
      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);

      const nouveau = ecouter(sut.execute('session-uuid', PARTICIPANT_ID));
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(siens)).toEqual(
        seulLePremierTermine(MAX_FLUX_PAR_PARTICIPANT),
      );
      expect(siens[0].types()).not.toContain('fin');
      expect(nouveau.types()).toContain('etat');
      expect(nouveau.terminee()).toBe(false);
      fermer([...siens, nouveau]);
    });

    it('rend sa place au formateur quand l un de ses flux se ferme', async () => {
      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );
      formateur[0].abonnement.unsubscribe();

      const nouveau = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(formateur.slice(1))).not.toContain(true);
      fermer([...formateur, nouveau]);
    });

    it('rend sa place au participant quand l un de ses flux se ferme', async () => {
      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);
      siens[0].abonnement.unsubscribe();

      const nouveau = ecouter(sut.execute('session-uuid', PARTICIPANT_ID));
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(siens.slice(1))).not.toContain(true);
      fermer([...siens, nouveau]);
    });

    it('ne laisse aucune place au participant ni a la seance apres un remplacement puis la fermeture de ses flux', async () => {
      fermer(await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT + 1));
      expect(jest.getTimerCount()).toBe(0);

      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);
      const autres = await ouvrirFluxEtudiants(
        MAX_ABONNEMENTS_PAR_SESSION - MAX_FLUX_PAR_PARTICIPANT,
      );

      expect(terminees(siens)).not.toContain(true);
      expect(() =>
        sut.execute(
          'session-uuid',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).toThrow(SessionStreamLimitError);
      fermer([...siens, ...autres]);
    });

    it('ne laisse aucune place au formateur apres un remplacement puis la fermeture de ses flux', async () => {
      fermer(await ouvrirFluxFormateur(MAX_FLUX_FORMATEUR_PAR_SESSION + 1));
      expect(jest.getTimerCount()).toBe(0);

      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );
      expect(terminees(formateur)).not.toContain(true);

      const nouveau = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(formateur)).toEqual(
        seulLePremierTermine(MAX_FLUX_FORMATEUR_PAR_SESSION),
      );
      fermer([...formateur, nouveau]);
    });

    it('remplace le plus ancien flux d un participant a son plafond meme quand la seance est pleine, sans ouvrir la seance a un nouveau participant', async () => {
      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);
      const autres = await ouvrirFluxEtudiants(
        MAX_ABONNEMENTS_PAR_SESSION - MAX_FLUX_PAR_PARTICIPANT,
      );

      const nouveau = ecouter(sut.execute('session-uuid', PARTICIPANT_ID));
      await jest.advanceTimersByTimeAsync(10);

      expect(terminees(siens)).toEqual(
        seulLePremierTermine(MAX_FLUX_PAR_PARTICIPANT),
      );
      expect(nouveau.types()).toContain('etat');
      expect(() =>
        sut.execute(
          'session-uuid',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).toThrow(SessionStreamLimitError);
      fermer([...siens, ...autres, nouveau]);
    });

    it('applique le plafond de session entre deux instances', async () => {
      const capacite = capacitePartagee();
      const cetteInstance = new StreamSessionUseCase(
        sessions,
        new SessionStateCacheService(),
        resultats,
        undefined,
        capacite,
      );
      const autreInstance = new StreamSessionUseCase(
        sessions,
        new SessionStateCacheService(),
        resultats,
        undefined,
        capacite,
      );
      const surCetteInstance = Array.from(
        { length: MAX_ABONNEMENTS_PAR_SESSION / 2 },
        (_, rang) =>
          ecouter(
            cetteInstance.execute('session-uuid', participantDeRang(rang)),
          ),
      );
      const surAutreInstance = Array.from(
        { length: MAX_ABONNEMENTS_PAR_SESSION / 2 },
        (_, rang) =>
          ecouter(
            autreInstance.execute('session-uuid', participantDeRang(50 + rang)),
          ),
      );
      await jest.advanceTimersByTimeAsync(10);

      const erreur = new Promise<unknown>((resolve) => {
        autreInstance
          .execute('session-uuid', 'participant-au-dela-du-plafond')
          .subscribe({
            error: resolve,
          });
      });
      await expect(erreur).resolves.toBeInstanceOf(SessionStreamLimitError);
      fermer([...surCetteInstance, ...surAutreInstance]);
    });
  });

  it('ouvre le flux au formateur proprietaire de la session', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID }),
    );

    const flux = await sut.executeForTeacher('session-uuid', TEACHER_ID);
    const premier = firstValueFrom(flux);
    await jest.advanceTimersByTimeAsync(10);

    expect((await premier).type).toBe('etat');
  });

  it('refuse le flux a un formateur qui n est pas celui de la session', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ teacherId: TEACHER_ID }),
    );

    await expect(
      sut.executeForTeacher('session-uuid', 'autre-teacher-uuid'),
    ).rejects.toThrow(SessionNotOwnedError);
  });

  it('tient le flux jusqu a sa duree maximale puis le termine avec la raison expiree', async () => {
    const dureeMaxMs = 60_000;
    const brefs = new StreamSessionUseCase(sessions, cache, resultats, {
      battementMs: HEARTBEAT_MS_TEST,
      dureeMaxMs,
    });
    const collected: MessageEvent[] = [];
    let termine = false;
    const subscription = brefs
      .execute('session-uuid', PARTICIPANT_ID)
      .subscribe({
        next: (event) => collected.push(event),
        complete: () => {
          termine = true;
        },
      });

    await jest.advanceTimersByTimeAsync(dureeMaxMs - 1000);
    expect(termine).toBe(false);

    await jest.advanceTimersByTimeAsync(2000);
    expect(termine).toBe(true);
    const dernier = collected[collected.length - 1];
    expect(dernier.type).toBe('fin');
    expect((dernier.data as Record<string, unknown>)['raison']).toBe('expiree');

    subscription.unsubscribe();
  });

  it('tient cinq heures en production, avec un battement toutes les quinze secondes', () => {
    expect(CADENCES_PRODUCTION.dureeMaxMs).toBe(CINQ_HEURES_MS);
    expect(CADENCES_PRODUCTION.battementMs).toBe(15_000);
  });

  describe('resultats agreges', () => {
    it('pousse au formateur les resultats et les statistiques du depot des le premier passage', async () => {
      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(ecoute.evenements.map((evenement) => evenement.type)).toEqual([
        'etat',
        'resultats',
      ]);
      expect(ecoute.resultats()).toEqual([
        {
          participants: 1,
          questions: [
            buildResultatQuestion({
              questionId: 'Q-CAP-03',
              ecranId: '',
              total: 1,
              correctes: 1,
            }),
          ],
          statistiques: {
            moyenne: 20,
            mediane: 20,
            dispersion: 0,
            tauxParticipation: 1,
            tauxReussite: 1,
            questionsProblemes: [],
          },
        },
      ]);
      expect(answers.listBySession).toHaveBeenCalledWith('session-uuid');
      expect(participants.listBySession).toHaveBeenCalledWith('session-uuid');
      ecoute.abonnement.unsubscribe();
    });

    it('ne recalcule pas les resultats sans activite nouvelle', async () => {
      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10 * INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toHaveLength(1);
      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      ecoute.abonnement.unsubscribe();
    });

    it('repousse les resultats recalcules apres une activite signalee', async () => {
      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);
      answers.listBySession.mockResolvedValue([
        buildAnswerRecord(),
        REPONSE_FAUSSE,
      ]);

      cache.signalerActivite('session-uuid');
      await jest.advanceTimersByTimeAsync(INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toHaveLength(2);
      expect(ecoute.resultats()[1].questions[0]).toMatchObject({
        total: 2,
        correctes: 1,
      });
      ecoute.abonnement.unsubscribe();
    });

    it('n emet jamais les resultats sur le flux etudiant, meme apres une activite', async () => {
      const ecoute = ecouter(sut.execute('session-uuid', PARTICIPANT_ID));
      await jest.advanceTimersByTimeAsync(10);

      cache.signalerActivite('session-uuid');
      await jest.advanceTimersByTimeAsync(4 * INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toEqual([]);
      expect(answers.listBySession).not.toHaveBeenCalled();
      ecoute.abonnement.unsubscribe();
    });

    it('recalcule depuis le depot les resultats d une nouvelle instance au cache neuf', async () => {
      cache.signalerActivite('session-uuid');
      cache.signalerActivite('session-uuid');
      answers.listBySession.mockResolvedValue([
        buildAnswerRecord(),
        REPONSE_FAUSSE,
      ]);
      participants.listBySession.mockResolvedValue([
        buildParticipantRecord(),
        buildParticipantRecord({ id: 'participant-2-uuid', seed: 1002 }),
      ]);
      const redemarre = new StreamSessionUseCase(
        sessions,
        new SessionStateCacheService(),
        resultats,
      );

      const ecoute = ecouter(
        await redemarre.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(ecoute.resultats()).toHaveLength(1);
      expect(ecoute.resultats()[0]).toMatchObject({
        participants: 2,
        questions: [
          {
            total: 2,
            correctes: 1,
            confusions: [{ id: 'interet-simple', nombre: 1 }],
          },
        ],
      });
      ecoute.abonnement.unsubscribe();
    });

    it('agrege avec le bareme de la session lue au controle de propriete', async () => {
      const bareme = buildBareme();
      sessions.findById.mockResolvedValueOnce(
        buildSessionRecord({
          bareme: buildBareme({
            questions: [
              ...bareme.questions,
              { ...bareme.questions[0], id: 'Q-CAP-04' },
            ],
          }),
        }),
      );

      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(
        ecoute.resultats()[0].questions.map((question) => question.questionId),
      ).toEqual(['Q-CAP-03', 'Q-CAP-04']);
      ecoute.abonnement.unsubscribe();
    });

    it('ne superpose pas deux recalculs quand le depot tarde a repondre', async () => {
      answers.listBySession.mockReturnValueOnce(
        new Promise<readonly AnswerRecord[]>((resoudre) => {
          setTimeout(() => resoudre([]), 10 * INTERVALLE_MS_TEST);
        }),
      );
      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10);

      cache.signalerActivite('session-uuid');
      await jest.advanceTimersByTimeAsync(6 * INTERVALLE_MS_TEST);

      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      ecoute.abonnement.unsubscribe();
    });

    it('pousse les resultats definitifs avant de clore le flux d une seance terminee', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ etat: 'terminee' }),
      );

      const messages = firstValueFrom(
        (await sut.executeForTeacher('session-uuid', TEACHER_ID)).pipe(
          toArray(),
        ),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect((await messages).map((message) => message.type)).toEqual([
        'etat',
        'resultats',
        'fin',
      ]);
    });
  });

  describe('panne passagere de la base', () => {
    const PANNE = new Error('connexion au serveur perdue');
    let avertissement: jest.SpyInstance;

    beforeEach(() => {
      avertissement = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      avertissement.mockRestore();
    });

    const passerDeuxPassages = async (): Promise<void> => {
      await jest.advanceTimersByTimeAsync(10);
      await jest.advanceTimersByTimeAsync(INTERVALLE_MS_TEST);
    };

    const expectPanneJournalisee = (): void => {
      expect(avertissement).toHaveBeenCalledTimes(1);
      expect(avertissement).toHaveBeenCalledWith(
        expect.stringContaining('session-uuid'),
      );
      expect(avertissement).toHaveBeenCalledWith(
        expect.stringContaining(PANNE.message),
      );
    };

    it('garde le flux etudiant ouvert et emet l etat au passage suivant', async () => {
      sessions.findById.mockRejectedValueOnce(PANNE);

      const ecoute = ecouter(sut.execute('session-uuid', PARTICIPANT_ID));
      await passerDeuxPassages();

      expectPanneJournalisee();
      expect(ecoute.evenements.map((evenement) => evenement.type)).toEqual([
        'etat',
      ]);
      ecoute.abonnement.unsubscribe();
    });

    it('garde le flux formateur ouvert et pousse les resultats au passage suivant', async () => {
      answers.listBySession.mockRejectedValueOnce(PANNE);

      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await passerDeuxPassages();

      expectPanneJournalisee();
      expect(ecoute.evenements.map((evenement) => evenement.type)).toEqual([
        'etat',
        'resultats',
      ]);
      ecoute.abonnement.unsubscribe();
    });

    it('clot le flux formateur d une seance terminee quand la lecture des resultats reste en echec, sur un seul avertissement', async () => {
      sessions.findById.mockResolvedValue(
        buildSessionRecord({ etat: 'terminee' }),
      );
      answers.listBySession.mockRejectedValue(PANNE);

      const ecoute = ecouter(
        await sut.executeForTeacher('session-uuid', TEACHER_ID),
      );
      await jest.advanceTimersByTimeAsync(10 * INTERVALLE_MS_TEST);

      expect(ecoute.evenements.map((evenement) => evenement.type)).toEqual([
        'etat',
        'fin',
      ]);
      expectPanneJournalisee();
      expect(cache.read('session-uuid')).toBeNull();
      ecoute.abonnement.unsubscribe();
    });
  });
});
