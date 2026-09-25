import { buildAuditAutomationConfig } from '../../../../../test/factories/audit-config.factory';
import type { AuditAutomationConfig } from './audit.config';
import type { AuditQueueService } from './audit-queue.service';

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
  const config: AuditAutomationConfig = buildAuditAutomationConfig({
    queueConcurrency: 2,
    jobTimeoutMs: 5_000,
  });

  let queueService: jest.Mocked<
    Pick<
      AuditQueueService,
      'isQueueEnabled' | 'connection' | 'queueName' | 'runWithTimeout'
    >
  >;

  function createService(
    queueOverrides: Partial<
      Pick<AuditQueueService, 'isQueueEnabled' | 'connection' | 'queueName'>
    > = {},
  ): AuditWorkerService {
    queueService = {
      isQueueEnabled: true,
      connection: { host: 'localhost', port: 6379 },
      queueName: 'audit_requests',
      runWithTimeout: jest.fn().mockResolvedValue(undefined),
      ...queueOverrides,
    };
    return new AuditWorkerService(
      config,
      queueService as unknown as AuditQueueService,
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

  it('le processeur confie l audit du job a l execution bornee de la file', async () => {
    const service = createService();
    service.onModuleInit();

    const processorFn = Worker.mock.calls[0][1] as (job: {
      data: { auditId: string };
    }) => Promise<void>;
    await processorFn({ data: { auditId: 'audit-123' } });

    expect(queueService.runWithTimeout).toHaveBeenCalledWith('audit-123');
  });
});
