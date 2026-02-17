import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditSummarySnapshot } from '../domain/AuditProcessing';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AUDIT_REQUESTS_REPOSITORY } from '../domain/token';

@Injectable()
export class GetAuditSummaryUseCase {
  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
  ) {}

  async execute(auditId: string): Promise<AuditSummarySnapshot> {
    const summary = await this.repo.findSummaryById(auditId);
    if (!summary) {
      throw new NotFoundException('Audit not found.');
    }
    return summary;
  }
}
