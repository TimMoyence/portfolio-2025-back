import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { StreamAuditEventsUseCase } from './StreamAuditEvents.useCase';
import type { AuditSnapshot } from '../domain/AuditProcessing';
import {
  buildAuditSnapshot,
  buildClientReportSynthesis,
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

  function collectEvents(audit: AuditSnapshot | null): Promise<MessageEvent[]> {
    repo.findById.mockResolvedValue(audit);
    const eventsPromise = firstValueFrom(
      useCase.execute('audit-1').pipe(toArray()),
    );
    return jest.advanceTimersByTimeAsync(0).then(() => eventsPromise);
  }

  it('devrait emettre un snapshot initial', async () => {
    const audit = buildAuditSnapshot();
    repo.findById.mockResolvedValue(audit);

    const resultPromise = firstValueFrom(useCase.execute('audit-1'));

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

  async function uniqueEvenementTermine(
    overrides: Partial<AuditSnapshot> = {},
  ): Promise<Record<string, unknown>> {
    const events = await collectEvents(
      buildAuditSnapshot({
        processingStatus: 'COMPLETED',
        progress: 100,
        done: true,
        summaryText: 'Rapport final',
        ...overrides,
      }),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('completed');
    return events[0].data as Record<string, unknown>;
  }

  async function suivreLeFluxApresLeSnapshotInitial() {
    repo.findById.mockResolvedValue(buildAuditSnapshot());
    const suivi = { collected: [] as MessageEvent[], completed: false };
    const subscription = useCase.execute('audit-1').subscribe({
      next: (event) => suivi.collected.push(event),
      complete: () => {
        suivi.completed = true;
      },
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(suivi.collected).toHaveLength(1);
    return { suivi, subscription };
  }

  it('devrait completer le stream quand le statut est COMPLETED', async () => {
    const data = await uniqueEvenementTermine();
    expect(data['summaryText']).toBe('Rapport final');
    expect(data['clientReport']).toBeNull();
  });

  it('devrait inclure le clientReport dans l event completed quand il est persiste', async () => {
    const clientReport = buildClientReportSynthesis();
    const data = await uniqueEvenementTermine({
      clientReport: clientReport as never,
    });
    expect(data['clientReport']).toEqual(clientReport);
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
    const events = await collectEvents(audit);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('failed');
    expect((events[0].data as Record<string, unknown>)['error']).toBe(
      'Timeout',
    );
  });

  it('devrait ne pas re-emettre si le fingerprint n a pas change', async () => {
    const { suivi, subscription } = await suivreLeFluxApresLeSnapshotInitial();

    await jest.advanceTimersByTimeAsync(2000);
    expect(suivi.collected).toHaveLength(1);

    subscription.unsubscribe();
  });

  it('devrait fermer le stream apres le timeout global de 30 minutes', async () => {
    const { suivi, subscription } = await suivreLeFluxApresLeSnapshotInitial();

    await jest.advanceTimersByTimeAsync(30 * 60 * 1000);

    const timeoutEvent = suivi.collected.find((e) => e.type === 'timeout');
    expect(timeoutEvent).toBeDefined();
    expect((timeoutEvent!.data as Record<string, unknown>)['status']).toBe(
      'TIMEOUT',
    );
    expect(suivi.completed).toBe(true);

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

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(2000);

    const events = await eventsPromise;
    expect(events).toHaveLength(2);
    expect((events[0].data as Record<string, unknown>)['progress']).toBe(30);
    expect((events[1].data as Record<string, unknown>)['progress']).toBe(60);
  });
});
