import { Inject, Injectable, Logger } from '@nestjs/common';
import { enArrierePlan } from '../../../common/application/en-arriere-plan';
import type { IAuditNotifierPort } from '../domain/IAuditNotifier.port';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { SelfAuditGuard } from '../domain/SelfAuditGuard';
import {
  AUDIT_NOTIFIER,
  AUDIT_QUEUE,
  AUDIT_REQUESTS_REPOSITORY,
  AUDIT_SELF_GUARD,
} from '../domain/token';
import { CreateAuditRequestCommand } from './dto/CreateAuditRequest.command';
import { AuditRequestMapper } from './mappers/AuditRequest.mapper';

@Injectable()
export class CreateAuditRequestsUseCase {
  private readonly logger = new Logger(CreateAuditRequestsUseCase.name);

  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    @Inject(AUDIT_QUEUE)
    private readonly queueService: IAuditQueuePort,
    @Inject(AUDIT_NOTIFIER)
    private readonly notifier: IAuditNotifierPort,
    @Inject(AUDIT_SELF_GUARD)
    private readonly selfGuard: SelfAuditGuard,
  ) {}

  async execute(
    data: CreateAuditRequestCommand,
  ): Promise<AuditRequestResponse> {
    this.selfGuard.ensureNotSelf(data.websiteName);

    const request = AuditRequestMapper.fromCreateCommand(data);
    const response = await this.repo.create(request);

    await this.queueService.enqueue(response.auditId);

    enArrierePlan(
      this.notifier.sendAuditNotification(request),
      'Audit request notification failed',
      this.logger,
    );

    return response;
  }
}
