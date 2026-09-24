import { Injectable } from '@nestjs/common';
import { ImprimeriePdf } from '../../../common/infrastructure/pdf/ImprimeriePdf';
import type { IToolkitPdfGenerator } from '../domain/IToolkitPdfGenerator';
import type { LeadMagnetRequest } from '../domain/LeadMagnetRequest';
import type { ToolkitContent } from '../domain/ToolkitContent';
import { ToolkitHtmlRendererService } from './ToolkitHtmlRenderer.service';

@Injectable()
export class ToolkitPdfGeneratorService
  extends ImprimeriePdf
  implements IToolkitPdfGenerator
{
  constructor(private readonly htmlRenderer: ToolkitHtmlRendererService) {
    super();
  }

  generate(
    _request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer> {
    return this.imprimer(this.htmlRenderer.render(content));
  }
}
