import { of } from 'rxjs';
import type { CreateAuditRequestsUseCase } from '../application/CreateAuditRequests.useCase';
import type { GetAuditSummaryUseCase } from '../application/GetAuditSummary.useCase';
import type { StreamAuditEventsUseCase } from '../application/StreamAuditEvents.useCase';
import { AuditsController } from './Audits.controller';

/**
 * Cree un jeu de mocks types pour les use cases injectes dans AuditsController.
 * Les use cases sont des classes concretes avec des dependances privees ; on ne
 * peut pas les instancier sans leur graphe complet. On mock uniquement execute().
 */
function buildUseCaseMocks(): {
  createUseCase: jest.Mocked<Pick<CreateAuditRequestsUseCase, 'execute'>>;
  summaryUseCase: jest.Mocked<Pick<GetAuditSummaryUseCase, 'execute'>>;
  streamUseCase: jest.Mocked<Pick<StreamAuditEventsUseCase, 'execute'>>;
  controller: AuditsController;
} {
  const createUseCase: jest.Mocked<
    Pick<CreateAuditRequestsUseCase, 'execute'>
  > = { execute: jest.fn() };
  const summaryUseCase: jest.Mocked<Pick<GetAuditSummaryUseCase, 'execute'>> = {
    execute: jest.fn(),
  };
  const streamUseCase: jest.Mocked<Pick<StreamAuditEventsUseCase, 'execute'>> =
    { execute: jest.fn() };

  const controller = new AuditsController(
    createUseCase as unknown as CreateAuditRequestsUseCase,
    summaryUseCase as unknown as GetAuditSummaryUseCase,
    streamUseCase as unknown as StreamAuditEventsUseCase,
  );

  return { createUseCase, summaryUseCase, streamUseCase, controller };
}

describe('AuditsController SSE', () => {
  it('returns progress and completed events from stream use case', (done) => {
    const { streamUseCase, controller } = buildUseCaseMocks();
    streamUseCase.execute.mockReturnValue(
      of(
        {
          type: 'progress',
          data: {
            auditId: 'audit-1',
            status: 'RUNNING',
            progress: 30,
            step: 'Analyse homepage',
            details: { phase: 'technical_pages', done: 2, total: 10 },
            done: false,
            updatedAt: new Date().toISOString(),
          },
        },
        {
          type: 'completed',
          data: {
            auditId: 'audit-1',
            status: 'COMPLETED',
            progress: 100,
            done: true,
            summaryText: 'Résumé',
            keyChecks: {},
            quickWins: [],
            pillarScores: {},
            updatedAt: new Date().toISOString(),
          },
        },
      ),
    );

    const events: Array<{ type: string }> = [];
    controller.stream('audit-1').subscribe({
      next: (event) => events.push({ type: event.type ?? 'unknown' }),
      complete: () => {
        expect(events).toEqual([{ type: 'progress' }, { type: 'completed' }]);
        done();
      },
    });
  });

  it('returns progress then failed events from stream use case', (done) => {
    const { streamUseCase, controller } = buildUseCaseMocks();
    streamUseCase.execute.mockReturnValue(
      of(
        {
          type: 'progress',
          data: {
            auditId: 'audit-2',
            status: 'RUNNING',
            progress: 60,
            step: 'Analyse sitemap',
            done: false,
            updatedAt: new Date().toISOString(),
          },
        },
        {
          type: 'failed',
          data: {
            auditId: 'audit-2',
            status: 'FAILED',
            progress: 100,
            done: false,
            error: 'timeout',
            updatedAt: new Date().toISOString(),
          },
        },
      ),
    );

    const events: Array<{ type: string }> = [];
    controller.stream('audit-2').subscribe({
      next: (event) => events.push({ type: event.type ?? 'unknown' }),
      complete: () => {
        expect(events).toEqual([{ type: 'progress' }, { type: 'failed' }]);
        done();
      },
    });
  });
});
