import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { StreamAuditEventsUseCase } from './StreamAuditEvents.useCase';
import {
  buildAuditSnapshot,
  createMockAuditRequestsRepo,
} from '../../../../test/factories/audit-requests.factory';

describe('StreamAuditEventsUseCase', () => {
  let useCase: StreamAuditEventsUseCase;
  let repo: jest.Mocked<IAuditRequestsRepository>;

  beforeEach(() => {
    jest.useFakeTimers();
    repo = createMockAuditRequestsRepo();
    useCase = new StreamAuditEventsUseCase(repo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devrait emettre un snapshot initial', async () => {
    const audit = buildAuditSnapshot();
    repo.findById.mockResolvedValue(audit);

    const resultPromise = firstValueFrom(useCase.execute('audit-1'));

    // Laisser la micro-tache (emitSnapshot) se resoudre
    await jest.advanceTimersByTimeAsync(0);

    const event = await resultPromise;
    expect(event.type).toBe('progress');
    expect((event.data as Record<string, unknown>)['auditId']).toBe('audit-1');
    expect((event.data as Record<string, unknown>)['progress']).toBe(50);
  });

  it('devrait emettre un event "failed" si l audit n existe pas', async () => {
    repo.findById.mockResolvedValue(null);

    const resultPromise = firstValueFrom(useCase.execute('missing-id'));

    await jest.advanceTimersByTimeAsync(0);

    const event = await resultPromise;
    expect(event.type).toBe('failed');
    expect((event.data as Record<string, unknown>)['error']).toBe(
      'Audit not found.',
    );
  });

  it('devrait completer le stream quand le statut est COMPLETED', async () => {
    const audit = buildAuditSnapshot({
      processingStatus: 'COMPLETED',
      progress: 100,
      done: true,
      summaryText: 'Rapport final',
    });
    repo.findById.mockResolvedValue(audit);

    const eventsPromise = firstValueFrom(
      useCase.execute('audit-1').pipe(toArray()),
    );

    await jest.advanceTimersByTimeAsync(0);

    const events = await eventsPromise;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('completed');
    expect((events[0].data as Record<string, unknown>)['summaryText']).toBe(
      'Rapport final',
    );
    // Phase 7 — backward compat : clientReport present (null par defaut)
    expect(
      (events[0].data as Record<string, unknown>)['clientReport'],
    ).toBeNull();
  });

  it('devrait inclure le clientReport dans l event completed quand il est persiste', async () => {
    const clientReport = {
      executiveSummary: 'Synthese client',
      topFindings: [],
      googleVsAiMatrix: {
        googleVisibility: { score: 80, summary: 'OK' },
        aiVisibility: { score: 40, summary: 'A ameliorer' },
      },
      pillarScorecard: [],
      quickWins: [],
      cta: { title: 'CTA', description: 'Desc', actionLabel: 'Action' },
    };
    const audit = buildAuditSnapshot({
      processingStatus: 'COMPLETED',
      progress: 100,
      done: true,
      summaryText: 'Rapport final',
      clientReport: clientReport as never,
    });
    repo.findById.mockResolvedValue(audit);

    const eventsPromise = firstValueFrom(
      useCase.execute('audit-1').pipe(toArray()),
    );

    await jest.advanceTimersByTimeAsync(0);

    const events = await eventsPromise;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('completed');
    const data = events[0].data as Record<string, unknown>;
    expect(data['clientReport']).toEqual(clientReport);
    // Backward compat : les champs existants restent
    expect(data['summaryText']).toBe('Rapport final');
    expect(data['keyChecks']).toBeDefined();
    expect(data['quickWins']).toBeDefined();
    expect(data['pillarScores']).toBeDefined();
  });

  it('devrait completer le stream quand le statut est FAILED', async () => {
    const audit = buildAuditSnapshot({
      processingStatus: 'FAILED',
      progress: 100,
      error: 'Timeout',
    });
    repo.findById.mockResolvedValue(audit);

    const eventsPromise = firstValueFrom(
      useCase.execute('audit-1').pipe(toArray()),
    );

    await jest.advanceTimersByTimeAsync(0);

    const events = await eventsPromise;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('failed');
    expect((events[0].data as Record<string, unknown>)['error']).toBe(
      'Timeout',
    );
  });

  it('devrait ne pas re-emettre si le fingerprint n a pas change', async () => {
    const audit = buildAuditSnapshot();
    repo.findById.mockResolvedValue(audit);

    const collected: MessageEvent[] = [];
    const subscription = useCase.execute('audit-1').subscribe((event) => {
      collected.push(event);
    });

    // Premier appel initial
    await jest.advanceTimersByTimeAsync(0);
    expect(collected).toHaveLength(1);

    // Deuxieme appel via polling (meme fingerprint)
    await jest.advanceTimersByTimeAsync(2000);
    expect(collected).toHaveLength(1);

    subscription.unsubscribe();
  });

  it('devrait fermer le stream apres le timeout global de 30 minutes', async () => {
    const audit = buildAuditSnapshot();
    repo.findById.mockResolvedValue(audit);

    const collected: MessageEvent[] = [];
    let completed = false;
    const subscription = useCase.execute('audit-1').subscribe({
      next: (event) => collected.push(event),
      complete: () => {
        completed = true;
      },
    });

    // Premier snapshot
    await jest.advanceTimersByTimeAsync(0);
    expect(collected).toHaveLength(1);

    // Avancer de 30 minutes
    await jest.advanceTimersByTimeAsync(30 * 60 * 1000);

    const timeoutEvent = collected.find((e) => e.type === 'timeout');
    expect(timeoutEvent).toBeDefined();
    expect((timeoutEvent!.data as Record<string, unknown>)['status']).toBe(
      'TIMEOUT',
    );
    expect(completed).toBe(true);

    subscription.unsubscribe();
  });

  it('devrait emettre a nouveau si le fingerprint change', async () => {
    const audit1 = buildAuditSnapshot({ progress: 30 });
    const audit2 = buildAuditSnapshot({
      progress: 60,
      updatedAt: new Date('2026-01-01T00:01:00Z'),
    });
    repo.findById.mockResolvedValueOnce(audit1).mockResolvedValueOnce(audit2);

    const eventsPromise = firstValueFrom(
      useCase.execute('audit-1').pipe(take(2), toArray()),
    );

    // Premier appel initial
    await jest.advanceTimersByTimeAsync(0);
    // Deuxieme appel via polling avec fingerprint different
    await jest.advanceTimersByTimeAsync(2000);

    const events = await eventsPromise;
    expect(events).toHaveLength(2);
    expect((events[0].data as Record<string, unknown>)['progress']).toBe(30);
    expect((events[1].data as Record<string, unknown>)['progress']).toBe(60);
  });
});
