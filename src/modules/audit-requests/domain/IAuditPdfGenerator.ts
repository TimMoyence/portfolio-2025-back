import type { AuditSnapshot } from './AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from './AuditReportTiers';

export interface IAuditPdfGenerator {
  generate(
    audit: AuditSnapshot,
    clientReport: ClientReportSynthesis,
    expertReport: ExpertReportSynthesis,
  ): Promise<Buffer>;
}

export const AUDIT_PDF_GENERATOR = Symbol('AUDIT_PDF_GENERATOR');
