import { AuditProcessingStatus } from './AuditProcessing';

/** Reponse domaine confirmant la creation et la mise en file d'une demande d'audit. */
export class AuditRequestResponse {
  message: string;
  auditId: string;
  status: AuditProcessingStatus;
}
