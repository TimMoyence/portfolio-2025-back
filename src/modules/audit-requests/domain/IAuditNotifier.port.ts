import type { MethodeDeContact } from './AuditRequest';
import { AuditRequest } from './AuditRequest';
import type { AuditLocale } from './audit-locale.util';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from './AuditReportTiers';

export interface ClientReportMailInput {
  readonly to: string;
  readonly firstName: string | null;
  readonly websiteName: string;
  readonly clientReport: ClientReportSynthesis;
  readonly pdfBuffer: Buffer | null;
}

export interface ExpertReportMailInput {
  readonly websiteName: string;
  readonly auditId: string;
  readonly clientContact: { method: MethodeDeContact; value: string };
  readonly clientReport: ClientReportSynthesis;
  readonly expertReport: ExpertReportSynthesis;
  readonly pdfBuffer: Buffer;
}

export interface DemandeDeConfirmation {
  readonly to: string;
  readonly hote: string;
  readonly lien: string;
  readonly locale: AuditLocale;
}

export interface IAuditNotifierPort {
  demanderLaConfirmation(demande: DemandeDeConfirmation): Promise<void>;
  sendAuditNotification(request: AuditRequest): Promise<void>;
  sendClientReport(input: ClientReportMailInput): Promise<void>;
  sendExpertReport(input: ExpertReportMailInput): Promise<void>;
}
