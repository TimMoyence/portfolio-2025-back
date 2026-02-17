import { of } from 'rxjs';
import { AuditsController } from './Audits.controller';

describe('AuditsController SSE', () => {
  it('returns progress and completed events from stream use case', (done) => {
    const createUseCase = { execute: jest.fn() };
    const summaryUseCase = { execute: jest.fn() };
    const streamUseCase = {
      execute: jest.fn().mockReturnValue(
        of(
          {
            type: 'progress',
            data: {
              auditId: 'audit-1',
              status: 'RUNNING',
              progress: 30,
              step: 'Analyse homepage',
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
      ),
    };

    const controller = new AuditsController(
      createUseCase as any,
      summaryUseCase as any,
      streamUseCase as any,
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
});
