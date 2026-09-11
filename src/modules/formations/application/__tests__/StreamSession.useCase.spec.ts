import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import {
  buildSessionRecord,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { SessionStateCacheService } from '../../infrastructure/SessionStateCache.service';
import { StreamSessionUseCase } from '../StreamSession.useCase';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_MS_TEST = 15000;

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
