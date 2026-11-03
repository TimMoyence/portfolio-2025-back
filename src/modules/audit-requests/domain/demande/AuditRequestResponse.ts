import { AuditProcessingStatus } from '../traitement/AuditProcessing';

export class AuditRequestResponse {
  message: string;
  auditId: string;
  status: AuditProcessingStatus;
  heuresDeValiditeDeLaConfirmation: number | null;
}
