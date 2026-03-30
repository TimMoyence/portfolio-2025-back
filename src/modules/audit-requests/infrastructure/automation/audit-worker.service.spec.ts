import type { AuditAutomationConfig } from './audit.config';
import type { AuditPipelineService } from './audit-pipeline.service';
import type { AuditQueueService } from './audit-queue.service';

/** Mock du module bullmq : le constructeur Worker renvoie un objet avec on/close. */
const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Worker } = require('bullmq') as { Worker: jest.Mock };

import { AuditWorkerService } from './audit-worker.service';

describe('AuditWorkerService', () => {
  const config: Pick<
    AuditAutomationConfig,
    'queueConcurrency' | 'jobTimeoutMs'
  > = {
    queueConcurrency: 2,
    jobTimeoutMs: 5000,
  };

  const mockPipeline: jest.Mocked<Pick<AuditPipelineService, 'run'>> = {
    run: jest.fn().mockResolvedValue(undefined),
  };

  function buildQueueService(
    overrides: Partial<
      Pick<AuditQueueService, 'isQueueEnabled' | 'connection' | 'queueName'>
    > = {},
  ): jest.Mocked<
    Pick<
      AuditQueueService,
      'isQueueEnabled' | 'connection' | 'queueName' | 'enqueue'
    >
  > {
    return {
      isQueueEnabled: true,
      connection: { host: 'localhost', port: 6379 },
      queueName: 'audit_requests',
      enqueue: jest.fn(),
      ...overrides,
    };
  }

  function createService(
    queueOverrides: Partial<
      Pick<AuditQueueService, 'isQueueEnabled' | 'connection' | 'queueName'>
    > = {},
  ): AuditWorkerService {
    const queueService = buildQueueService(queueOverrides);
    return new AuditWorkerService(
      config as AuditAutomationConfig,
      queueService as jest.Mocked<AuditQueueService>,
      mockPipeline as jest.Mocked<AuditPipelineService>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('onModuleInit ne cree pas de worker si la queue est desactivee', () => {
    const service = createService({ isQueueEnabled: false });

    service.onModuleInit();

    expect(Worker).not.toHaveBeenCalled();
  });

  it('onModuleInit ne cree pas de worker si la connexion est absente', () => {
    const service = createService({
      isQueueEnabled: true,
      connection: undefined,
    });

    service.onModuleInit();

    expect(Worker).not.toHaveBeenCalled();
  });

  it('onModuleInit cree un worker si la queue est activee', () => {
    const service = createService();

    service.onModuleInit();

    expect(Worker).toHaveBeenCalledTimes(1);
    expect(Worker).toHaveBeenCalledWith(
      'audit_requests',
      expect.any(Function),
      expect.objectContaining({
        connection: { host: 'localhost', port: 6379 },
        concurrency: 2,
      }),
    );
    expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
    expect(mockWorkerOn).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('onModuleDestroy ferme le worker', async () => {
    const service = createService();
    service.onModuleInit();

    await service.onModuleDestroy();

    expect(mockWorkerClose).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy ne crashe pas sans worker', async () => {
    const service = createService({ isQueueEnabled: false });

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(mockWorkerClose).not.toHaveBeenCalled();
  });

  it('runWithTimeout lance une erreur si le pipeline depasse le timeout', async () => {
    jest.useFakeTimers();

    const neverResolves = new Promise<void>(() => {});
    mockPipeline.run.mockReturnValue(neverResolves);

    const service = createService();
    service.onModuleInit();

    // Recuperer le handler du worker passe au constructeur
    const processorFn = Worker.mock.calls[0][1] as (job: {
      data: { auditId: string };
    }) => Promise<void>;
    const jobPromise = processorFn({ data: { auditId: 'audit-123' } });

    jest.advanceTimersByTime(config.jobTimeoutMs);

    await expect(jobPromise).rejects.toThrow(
      `Audit pipeline timeout after ${config.jobTimeoutMs}ms (auditId=audit-123)`,
    );

    jest.useRealTimers();
  });
});
