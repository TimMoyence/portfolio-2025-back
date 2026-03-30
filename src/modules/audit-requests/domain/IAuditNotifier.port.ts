import { AuditRequest } from './AuditRequest';

/** Port de notification pour les demandes d'audit. */
export interface IAuditNotifierPort {
  sendAuditNotification(request: AuditRequest): Promise<void>;
}
