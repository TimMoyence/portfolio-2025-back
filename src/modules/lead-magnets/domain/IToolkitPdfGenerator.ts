import type { LeadMagnetRequest } from './LeadMagnetRequest';

/** Port de generation du PDF boite a outils. */
export interface IToolkitPdfGenerator {
  generate(request: LeadMagnetRequest): Promise<Buffer>;
}
