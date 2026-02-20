import { AuditProcessingStatus } from './AuditProcessing';

export class AuditRequestResponse {
  message: string;
  auditId: string;
  status: AuditProcessingStatus;
}
