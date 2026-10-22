import { Inject, Injectable } from '@nestjs/common';
import { LienInvalideError } from '../../../common/domain/errors/LienInvalideError';
import { TokenHash } from '../../../common/domain/crypto/TokenHash';
import type { IAuditQueuePort } from '../domain/IAuditQueue.port';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { AUDIT_QUEUE, AUDIT_REQUESTS_REPOSITORY } from '../domain/token';

export interface AuditConfirme {
  readonly auditId: string;
}

@Injectable()
export class ConfirmAuditRequestUseCase {
  constructor(
    @Inject(AUDIT_REQUESTS_REPOSITORY)
    private readonly repo: IAuditRequestsRepository,
    @Inject(AUDIT_QUEUE)
    private readonly queueService: IAuditQueuePort,
  ) {}

  async execute(jeton: string): Promise<AuditConfirme> {
    const auditId = await this.repo.confirmer(TokenHash.fromRaw(jeton).value);
    if (auditId === null) {
      throw new LienInvalideError();
    }
    await this.queueService.enqueue(auditId);
    return { auditId };
  }
}
