import type { LeadMagnetRequest } from './LeadMagnetRequest';
import type { MessageLeadMagnetResponse } from './MessageLeadMagnetResponse';

/** Port de persistance pour les demandes de lead magnet. */
export interface ILeadMagnetRequestRepository {
  create(data: LeadMagnetRequest): Promise<MessageLeadMagnetResponse>;
  existsRecentByEmail(email: string, formationSlug: string): Promise<boolean>;
}
