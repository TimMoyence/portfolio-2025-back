import type { LeadMagnetRequest } from './LeadMagnetRequest';
import type { ToolkitContent } from './ToolkitContent';

/** Port de generation du PDF boite a outils. */
export interface IToolkitPdfGenerator {
  generate(
    request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer>;
}
