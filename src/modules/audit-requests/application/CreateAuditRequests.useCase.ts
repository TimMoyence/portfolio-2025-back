import { Inject, Injectable } from '@nestjs/common';
import { AuditRequest } from '../domain/AuditRequest';
import { AuditRequestResponse } from '../domain/AuditRequestResponse';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AUDIT_REQUESTS_REPOSITORY } from '../domain/token';
import { AuditQueueService } from '../infrastructure/automation/audit-queue.service';
import { AuditRequestMailerService } from '../infrastructure/AuditRequestMailer.service';

@Injectable()
export class CreateAuditRequestsUseCase {
  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    private readonly queueService: AuditQueueService,
    private readonly auditMailer: AuditRequestMailerService,
  ) {}

  async execute(data: AuditRequest): Promise<AuditRequestResponse> {
    const response = await this.repo.create(data);

    await this.queueService.enqueue(response.auditId);

    void this.auditMailer
      .sendAuditNotification(data)
      .catch((err) => console.warn('Audit request notification failed', err));

    return response;
  }
}
