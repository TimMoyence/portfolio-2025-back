import { AuditRequest } from './AuditRequest';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from './AuditReportTiers';

/**
 * Payload du mail "rapport client" envoye au decideur final (adresse EMAIL
 * du formulaire). Porte la synthese strategique et eventuellement le PDF
 * attache (si la generation a reussi).
 */
export interface ClientReportMailInput {
  readonly to: string;
  readonly firstName: string | null;
  readonly websiteName: string;
  readonly clientReport: ClientReportSynthesis;
  readonly pdfBuffer: Buffer | null;
}

/**
 * Payload du mail "rapport expert" envoye en interne a Tim. Contient la
 * synthese expert, le draft de mail client pret a copier/coller et le PDF
 * (obligatoire pour cette variante).
 */
export interface ExpertReportMailInput {
  readonly websiteName: string;
  readonly auditId: string;
  readonly clientContact: { method: 'EMAIL' | 'PHONE'; value: string };
  readonly clientReport: ClientReportSynthesis;
  readonly expertReport: ExpertReportSynthesis;
  readonly pdfBuffer: Buffer;
}

/** Port de notification pour les demandes d'audit. */
export interface IAuditNotifierPort {
  sendAuditNotification(request: AuditRequest): Promise<void>;
  sendClientReport(input: ClientReportMailInput): Promise<void>;
  sendExpertReport(input: ExpertReportMailInput): Promise<void>;
}
