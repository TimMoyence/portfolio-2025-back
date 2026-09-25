import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditPipelineService } from './audit-pipeline.service';
import { AuditQueueService } from './audit-queue.service';

describe('AuditQueueService', () => {
  const config = buildAuditAutomationConfig({
    queueEnabled: false,
    jobTimeoutMs: 5_000,
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runWithTimeout rejette quand le pipeline dépasse le délai du job', async () => {
    jest.useFakeTimers();
    const pipeline = {
      run: jest.fn().mockReturnValue(new Promise<void>(() => {})),
    };
    const service = new AuditQueueService(
      config,
      pipeline as unknown as AuditPipelineService,
    );

    const execution = service.runWithTimeout('audit-123');
    jest.advanceTimersByTime(config.jobTimeoutMs);

    await expect(execution).rejects.toThrow(
      `Audit pipeline timeout after ${config.jobTimeoutMs}ms (auditId=audit-123)`,
    );
  });
});
