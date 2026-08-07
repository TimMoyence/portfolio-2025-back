import type { LeadMagnetRequest } from './LeadMagnetRequest';

export interface ILeadMagnetRequestRepository {
  create(data: LeadMagnetRequest): Promise<LeadMagnetRequest>;
  existsRecentByEmail(email: string, formationSlug: string): Promise<boolean>;
  findByToken(accessToken: string): Promise<LeadMagnetRequest | null>;
}
