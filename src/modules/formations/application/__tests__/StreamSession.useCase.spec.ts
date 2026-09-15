/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import type { Observable, Subscription } from 'rxjs';
import {
  buildAnswerRecord,
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionNotOwnedError,
  SessionStreamLimitError,
} from '../../domain/errors/FormationErrors';
import type { AnswerRecord } from '../../domain/IAnswers.repository';
import type { ResultatsSeance } from '../../domain/ResultatsSeance';
import { SessionStateCacheService } from '../../infrastructure/SessionStateCache.service';
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
}

function ecouter(flux: Observable<MessageEvent>): Ecoute {
  const evenements: MessageEvent[] = [];
  return {
    abonnement: flux.subscribe((evenement) => evenements.push(evenement)),
    evenements,
    resultats: () =>
      evenements
        .filter((evenement) => evenement.type === 'resultats')
        .map((evenement) => evenement.data as ResultatsSeance),
  };
}

describe('StreamSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: SessionStateCacheService;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: StreamSessionUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    sessions = createMockSessionsRepo();
    cache = new SessionStateCacheService();
    answers = createMockAnswersRepo();
    participants = createMockParticipantsRepo();
    sut = new StreamSessionUseCase(sessions, cache, answers, participants);
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

  describe('budgets de flux simultanes', () => {
    const ouvrirFluxEtudiants = async (
      nombre: number,
      sessionId = 'session-uuid',
    ): Promise<Subscription[]> => {
      const ouverts = Array.from({ length: nombre }, (_, rang) =>
        sut.execute(sessionId, participantDeRang(rang)).subscribe(),
      );
      await jest.advanceTimersByTimeAsync(10);
      return ouverts;
    };

    const fermer = (ouverts: readonly Subscription[]): void => {
      ouverts.forEach((abonnement) => abonnement.unsubscribe());
    };

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
      ouverts[0].unsubscribe();

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

      expect(ecoute.evenements.map((evenement) => evenement.type)).toContain(
        'etat',
      );
      ecoute.abonnement.unsubscribe();
      fermer(ouverts);
    });

    it('reserve au formateur des places que ses flux ne prennent pas aux etudiants', async () => {
      const formateur = await Promise.all(
        Array.from({ length: MAX_FLUX_FORMATEUR_PAR_SESSION }, async () =>
          (await sut.executeForTeacher('session-uuid', TEACHER_ID)).subscribe(),
        ),
      );
      await jest.advanceTimersByTimeAsync(10);

      await expect(
        sut.executeForTeacher('session-uuid', TEACHER_ID),
      ).rejects.toThrow(SessionStreamLimitError);
      const etudiants = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);
      expect(etudiants).toHaveLength(MAX_ABONNEMENTS_PAR_SESSION);

      fermer(formateur);
      fermer(etudiants);
    });

    it('rend sa place au formateur quand l un de ses flux se ferme', async () => {
      const formateur = await Promise.all(
        Array.from({ length: MAX_FLUX_FORMATEUR_PAR_SESSION }, async () =>
          (await sut.executeForTeacher('session-uuid', TEACHER_ID)).subscribe(),
        ),
      );
      await jest.advanceTimersByTimeAsync(10);
      formateur[0].unsubscribe();

      await expect(
        sut.executeForTeacher('session-uuid', TEACHER_ID),
      ).resolves.toBeDefined();

      fermer(formateur.slice(1));
    });

    it('refuse a un participant un flux au-dela de ses flux simultanes', async () => {
      const siens = Array.from({ length: MAX_FLUX_PAR_PARTICIPANT }, () =>
        sut.execute('session-uuid', PARTICIPANT_ID).subscribe(),
      );
      await jest.advanceTimersByTimeAsync(10);

      expect(() => sut.execute('session-uuid', PARTICIPANT_ID)).toThrow(
        SessionStreamLimitError,
      );
      expect(() =>
        sut.execute('session-uuid', participantDeRang(0)),
      ).not.toThrow();

      fermer(siens);
    });

    it('rend sa place au participant quand l un de ses flux se ferme', async () => {
      const siens = Array.from({ length: MAX_FLUX_PAR_PARTICIPANT }, () =>
        sut.execute('session-uuid', PARTICIPANT_ID).subscribe(),
      );
      await jest.advanceTimersByTimeAsync(10);
      siens[0].unsubscribe();

      expect(() => sut.execute('session-uuid', PARTICIPANT_ID)).not.toThrow();

      fermer(siens.slice(1));
    });

    it('ne compte pas au plafond de seance le flux refuse a un participant', async () => {
      const siens = Array.from({ length: MAX_FLUX_PAR_PARTICIPANT }, () =>
        sut.execute('session-uuid', PARTICIPANT_ID).subscribe(),
      );
      await jest.advanceTimersByTimeAsync(10);
      expect(() => sut.execute('session-uuid', PARTICIPANT_ID)).toThrow(
        SessionStreamLimitError,
      );

      const autres = await ouvrirFluxEtudiants(
        MAX_ABONNEMENTS_PAR_SESSION - MAX_FLUX_PAR_PARTICIPANT,
      );
      expect(() =>
        sut.execute(
          'session-uuid',
          participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        ),
      ).toThrow(SessionStreamLimitError);

      fermer(siens);
      fermer(autres);
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
    const brefs = new StreamSessionUseCase(
      sessions,
      cache,
      answers,
      participants,
      { battementMs: HEARTBEAT_MS_TEST, dureeMaxMs },
    );
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
    it('pousse au formateur les resultats du depot des le premier passage', async () => {
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
            {
              questionId: 'Q-CAP-03',
              total: 1,
              correctes: 1,
              neSaitPas: 0,
              confusions: [],
            },
          ],
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
        answers,
        participants,
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
