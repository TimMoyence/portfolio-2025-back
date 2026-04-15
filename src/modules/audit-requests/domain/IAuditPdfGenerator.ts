import type { AuditSnapshot } from './AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from './AuditReportTiers';

/**
 * Port du générateur PDF pour les rapports Growth Audit.
 * L'implémentation utilise Puppeteer (voir ToolkitPdfGeneratorService pour le pattern).
 */
export interface IAuditPdfGenerator {
  generate(
    audit: AuditSnapshot,
    clientReport: ClientReportSynthesis,
    expertReport: ExpertReportSynthesis,
  ): Promise<Buffer>;
}

export const AUDIT_PDF_GENERATOR = Symbol('AUDIT_PDF_GENERATOR');
