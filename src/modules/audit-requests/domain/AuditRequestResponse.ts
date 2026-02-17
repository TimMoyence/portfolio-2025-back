import { AuditProcessingStatus } from './AuditProcessing';

export class AuditRequestResponse {
  message: string;
  httpCode: number;
  auditId: string;
  status: AuditProcessingStatus;
}
