/* eslint-disable @typescript-eslint/unbound-method */
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
  StreamSessionUseCase,
} from '../StreamSession.useCase';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_MS_TEST = 15000;
const INTERVALLE_MS_TEST = 500;
const TEACHER_ID = 'teacher-uuid';

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
    const premier = firstValueFrom(sut.execute('session-uuid'));
    await jest.advanceTimersByTimeAsync(10);
    const message = await premier;
    expect(message.type).toBe('etat');
  });

  it('n emet pas deux fois le meme etat', async () => {
    const messages = firstValueFrom(
      sut.execute('session-uuid').pipe(take(2), toArray()),
    );
    await jest.advanceTimersByTimeAsync(HEARTBEAT_MS_TEST);
    const recus = await messages;
    expect(recus[1].type).toBe('heartbeat');
  });

  it('emet un nouvel etat quand l ecran change', async () => {
    const messages = firstValueFrom(
      sut.execute('session-uuid').pipe(take(2), toArray()),
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
      sut.execute('session-uuid').pipe(toArray()),
    );
    await jest.advanceTimersByTimeAsync(1000);
    const recus = await messages;
    expect(recus[recus.length - 1].type).toBe('fin');
  });

  it('vide le cache quand la session se termine', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ etat: 'terminee' }),
    );
    const subscription = sut.execute('session-uuid').subscribe();
    await jest.advanceTimersByTimeAsync(10);
    expect(cache.read('session-uuid')).toBeNull();
    subscription.unsubscribe();
  });

  it('ne vide pas le cache quand un client se desabonne d une session active', async () => {
    const subscription = sut.execute('session-uuid').subscribe();
    await jest.advanceTimersByTimeAsync(10);
    expect(cache.read('session-uuid')).not.toBeNull();
    subscription.unsubscribe();
    expect(cache.read('session-uuid')).not.toBeNull();
  });

  it('termine le flux quand la session est introuvable', async () => {
    sessions.findById.mockResolvedValue(null);
    const messages = firstValueFrom(
      sut.execute('session-uuid').pipe(toArray()),
    );
    await jest.advanceTimersByTimeAsync(10);
    const recus = await messages;
    expect(recus[recus.length - 1].type).toBe('fin');
  });

  it('borne le nombre d abonnements simultanes sur une meme session', async () => {
    const ouverts = Array.from({ length: MAX_ABONNEMENTS_PAR_SESSION }, () =>
      sut.execute('session-uuid').subscribe(),
    );
    await jest.advanceTimersByTimeAsync(10);

    expect(() => sut.execute('session-uuid')).toThrow(SessionStreamLimitError);

    ouverts.forEach((abonnement) => abonnement.unsubscribe());
  });

  it('ne compte pas deux sessions distinctes dans le meme plafond', async () => {
    const ouverts = Array.from({ length: MAX_ABONNEMENTS_PAR_SESSION }, () =>
      sut.execute('session-uuid').subscribe(),
    );
    await jest.advanceTimersByTimeAsync(10);

    expect(() => sut.execute('autre-session')).not.toThrow();

    ouverts.forEach((abonnement) => abonnement.unsubscribe());
  });

  it('rend sa place au plafond quand un client se desabonne', async () => {
    const ouverts = Array.from({ length: MAX_ABONNEMENTS_PAR_SESSION }, () =>
      sut.execute('session-uuid').subscribe(),
    );
    await jest.advanceTimersByTimeAsync(10);
    ouverts[0].unsubscribe();

    expect(() => sut.execute('session-uuid')).not.toThrow();

    ouverts.slice(1).forEach((abonnement) => abonnement.unsubscribe());
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
    const subscription = brefs.execute('session-uuid').subscribe({
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
      const ecoute = ecouter(sut.execute('session-uuid'));
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
});
