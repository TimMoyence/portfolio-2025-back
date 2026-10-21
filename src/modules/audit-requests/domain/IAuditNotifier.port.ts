import type { MethodeDeContact } from './AuditRequest';
import { AuditRequest } from './AuditRequest';
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

export interface IAuditNotifierPort {
  sendAuditNotification(request: AuditRequest): Promise<void>;
  sendClientReport(input: ClientReportMailInput): Promise<void>;
  sendExpertReport(input: ExpertReportMailInput): Promise<void>;
}
