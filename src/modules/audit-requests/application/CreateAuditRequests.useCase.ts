import { Inject, Injectable } from '@nestjs/common';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AUDIT_REQUESTS_REPOSITORY } from '../domain/token';
import { AuditQueueService } from '../infrastructure/automation/audit-queue.service';
import { AuditRequestMailerService } from '../infrastructure/AuditRequestMailer.service';
import { CreateAuditRequestCommand } from './dto/CreateAuditRequest.command';
import { AuditRequestMapper } from './mappers/AuditRequest.mapper';

@Injectable()
export class CreateAuditRequestsUseCase {
  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    private readonly queueService: AuditQueueService,
    private readonly auditMailer: AuditRequestMailerService,
  ) {}

  async execute(data: CreateAuditRequestCommand): Promise<AuditRequestResponse> {
    const request = AuditRequestMapper.fromCreateCommand(data);
    const response = await this.repo.create(request);

    await this.queueService.enqueue(response.auditId);

    void this.auditMailer
      .sendAuditNotification(request)
      .catch((err) => console.warn('Audit request notification failed', err));

    return response;
  }
}
