import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../../test/helpers/avertissements';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import type { AuditPipelineService } from './audit-pipeline.service';
import { AuditQueueService } from './audit-queue.service';

describe('AuditQueueService', () => {
  const config = buildAuditAutomationConfig({
    queueEnabled: false,
    jobTimeoutMs: 5_000,
  });
  const avertissements = espionnerLesAvertissements();

  afterEach(() => {
    jest.useRealTimers();
  });

  it('laisse un audit en retard aller au bout, sans échec ni nouvelle tentative au délai', async () => {
    jest.useFakeTimers();
    let terminer: () => void = () => undefined;
    const pipeline = {
      run: jest.fn().mockReturnValue(
        new Promise<void>((resoudre) => {
          terminer = resoudre;
        }),
      ),
    };
    const service = new AuditQueueService(
      config,
      pipeline as unknown as AuditPipelineService,
    );

    await service.enqueue('audit-123');
    await jest.advanceTimersByTimeAsync(config.jobTimeoutMs);

    expect(avertissements()).toHaveBeenCalledWith(
      `Audit audit-123 still running after ${config.jobTimeoutMs}ms, left to complete without retry`,
    );
    terminer();
    await jest.advanceTimersByTimeAsync(config.jobTimeoutMs);

    expect(avertissements()).not.toHaveBeenCalledWith(
      expect.stringContaining('failed'),
    );
    expect(pipeline.run).toHaveBeenCalledTimes(1);
  });

  it('ne signale aucun retard pour un audit fini dans son délai', async () => {
    jest.useFakeTimers();
    const pipeline = { run: jest.fn().mockResolvedValue(undefined) };
    const service = new AuditQueueService(
      config,
      pipeline as unknown as AuditPipelineService,
    );

    await service.runToCompletion('audit-123');
    await jest.advanceTimersByTimeAsync(config.jobTimeoutMs);

    expect(avertissements()).not.toHaveBeenCalledWith(
      expect.stringContaining('still running'),
    );
  });

  it('journalise la cause d un audit en ligne qui échoue', async () => {
    const pipeline = {
      run: jest.fn().mockRejectedValue(new Error('pipeline en panne')),
    };
    const service = new AuditQueueService(
      config,
      pipeline as unknown as AuditPipelineService,
    );

    await service.enqueue('audit-123');
    await flushPromises();

    await attendreLAvertissement(
      avertissements,
      'Inline audit execution failed for audit-123: pipeline en panne',
    );
  });
});
