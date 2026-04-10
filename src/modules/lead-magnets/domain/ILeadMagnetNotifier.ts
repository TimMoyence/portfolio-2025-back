import type { LeadMagnetRequest } from './LeadMagnetRequest';

/** Port de notification pour l'envoi du lead magnet par email. */
export interface ILeadMagnetNotifier {
  sendToolkitEmail(
    request: LeadMagnetRequest,
    pdfBuffer: Buffer,
  ): Promise<void>;
}
