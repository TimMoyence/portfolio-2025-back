import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import {
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  SessionNotOwnedError,
  SessionStreamLimitError,
} from '../../domain/errors/FormationErrors';
import { SessionStateCacheService } from '../../infrastructure/SessionStateCache.service';
import {
  MAX_ABONNEMENTS_PAR_SESSION,
  StreamSessionUseCase,
} from '../StreamSession.useCase';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_MS_TEST = 15000;
const TEACHER_ID = 'teacher-uuid';

describe('StreamSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: SessionStateCacheService;
  let sut: StreamSessionUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    sessions = createMockSessionsRepo();
    cache = new SessionStateCacheService();
    sut = new StreamSessionUseCase(sessions, cache);
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

  it('ne coupe pas le flux avant cinq heures mais le termine ensuite avec la raison expiree', async () => {
    const collected: MessageEvent[] = [];
    let termine = false;
    const subscription = sut.execute('session-uuid').subscribe({
      next: (event) => collected.push(event),
      complete: () => {
        termine = true;
      },
    });

    await jest.advanceTimersByTimeAsync(CINQ_HEURES_MS - 1000);
    expect(termine).toBe(false);

    await jest.advanceTimersByTimeAsync(2000);
    expect(termine).toBe(true);
    const dernier = collected[collected.length - 1];
    expect(dernier.type).toBe('fin');
    expect((dernier.data as Record<string, unknown>)['raison']).toBe('expiree');

    subscription.unsubscribe();
  });
});
