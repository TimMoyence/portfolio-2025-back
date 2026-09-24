import { Injectable } from '@nestjs/common';
import { ImprimeriePdf } from '../../../../common/infrastructure/pdf/ImprimeriePdf';
import type { AuditSnapshot } from '../../domain/AuditProcessing';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../domain/AuditReportTiers';
import type { IAuditPdfGenerator } from '../../domain/IAuditPdfGenerator';
import { AuditReportHtmlRendererService } from './audit-report-html-renderer.service';

@Injectable()
export class AuditPdfGeneratorService
  extends ImprimeriePdf
  implements IAuditPdfGenerator
{
  constructor(private readonly htmlRenderer: AuditReportHtmlRendererService) {
    super();
  }

  generate(
    audit: AuditSnapshot,
    clientReport: ClientReportSynthesis,
    expertReport: ExpertReportSynthesis,
  ): Promise<Buffer> {
    return this.imprimer(
      this.htmlRenderer.render(audit, clientReport, expertReport),
    );
  }
}
