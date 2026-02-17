import {
  AuditSnapshot,
  AuditSummarySnapshot,
  UpdateAuditStateInput,
} from './AuditProcessing';
import { AuditRequest } from './AuditRequest';
import { AuditRequestResponse } from './AuditRequestResponse';

export interface IAuditRequestsRepository {
  create(data: AuditRequest): Promise<AuditRequestResponse>;
  findById(id: string): Promise<AuditSnapshot | null>;
  findSummaryById(id: string): Promise<AuditSummarySnapshot | null>;
  updateState(id: string, state: UpdateAuditStateInput): Promise<void>;
}
