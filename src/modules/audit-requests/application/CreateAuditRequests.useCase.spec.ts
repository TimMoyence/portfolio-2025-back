/* eslint-disable @typescript-eslint/unbound-method */
import { CreateAuditRequestsUseCase } from './CreateAuditRequests.useCase';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import type { IAuditNotifierPort } from '../domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import { CreateAuditRequestCommand } from './dto/CreateAuditRequest.command';
import {
  createMockAuditRequestsRepo,
  createMockAuditNotifier,
  createMockAuditQueue,
} from '../../../../test/factories/audit-requests.factory';

describe('CreateAuditRequestsUseCase', () => {
  let useCase: CreateAuditRequestsUseCase;
  let repo: jest.Mocked<IAuditRequestsRepository>;
  let queueService: jest.Mocked<IAuditQueuePort>;
  let notifier: jest.Mocked<IAuditNotifierPort>;

  const validCommand: CreateAuditRequestCommand = {
    websiteName: 'example.com',
    contactMethod: 'EMAIL',
    contactValue: 'test@example.com',
    locale: 'fr',
  };

  const expectedResponse: AuditRequestResponse = (() => {
    const r = new AuditRequestResponse();
    r.message = "Demande d'audit creee";
    r.auditId = 'audit-123';
    r.status = 'PENDING';
    return r;
  })();

  beforeEach(() => {
    repo = createMockAuditRequestsRepo();
    queueService = createMockAuditQueue();
    notifier = createMockAuditNotifier();
    useCase = new CreateAuditRequestsUseCase(repo, queueService, notifier);

    repo.create.mockResolvedValue(expectedResponse);
    queueService.enqueue.mockResolvedValue(undefined);
    notifier.sendAuditNotification.mockResolvedValue(undefined);
  });

  it('devrait creer la demande, la mettre en file d attente et retourner la reponse', async () => {
    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result).toEqual(expectedResponse);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(queueService.enqueue).toHaveBeenCalledWith('audit-123');
    expect(notifier.sendAuditNotification).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner la reponse meme si la notification echoue', async () => {
    // Arrange
    notifier.sendAuditNotification.mockRejectedValue(new Error('SMTP error'));

    // Act
    const result = await useCase.execute(validCommand);

    // Assert
    expect(result).toEqual(expectedResponse);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(queueService.enqueue).toHaveBeenCalledTimes(1);
    expect(notifier.sendAuditNotification).toHaveBeenCalledTimes(1);
  });

  it('devrait appeler queueService.enqueue avec le bon auditId', async () => {
    // Arrange
    const customResponse = new AuditRequestResponse();
    customResponse.message = 'Demande creee';
    customResponse.auditId = 'audit-custom-456';
    customResponse.status = 'PENDING';
    repo.create.mockResolvedValue(customResponse);

    // Act
    await useCase.execute(validCommand);

    // Assert
    expect(queueService.enqueue).toHaveBeenCalledWith('audit-custom-456');
  });
});
