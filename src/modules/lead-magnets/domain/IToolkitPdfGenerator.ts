import type { LeadMagnetRequest } from './LeadMagnetRequest';
import type { ToolkitContent } from './ToolkitContent';

export interface IToolkitPdfGenerator {
  generate(
    request: LeadMagnetRequest,
    content: ToolkitContent,
  ): Promise<Buffer>;
}
