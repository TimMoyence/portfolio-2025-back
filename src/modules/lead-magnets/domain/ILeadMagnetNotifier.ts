import type { LeadMagnetRequest } from './LeadMagnetRequest';

export interface ILeadMagnetNotifier {
  sendToolkitEmail(
    request: LeadMagnetRequest,
    pdfBuffer: Buffer,
  ): Promise<void>;
}
