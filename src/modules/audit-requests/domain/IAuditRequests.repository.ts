import { AuditRequest } from './AuditRequest';
import { AuditRequestResponse } from './AuditRequestResponse';

export interface IAuditRequestsRepository {
  create(data: AuditRequest): Promise<AuditRequestResponse>;
}
