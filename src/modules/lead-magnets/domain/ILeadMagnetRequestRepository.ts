import type { LeadMagnetRequest } from './LeadMagnetRequest';

/** Port de persistance pour les demandes de lead magnet. */
export interface ILeadMagnetRequestRepository {
  create(data: LeadMagnetRequest): Promise<LeadMagnetRequest>;
  existsRecentByEmail(email: string, formationSlug: string): Promise<boolean>;
  findByToken(accessToken: string): Promise<LeadMagnetRequest | null>;
}
