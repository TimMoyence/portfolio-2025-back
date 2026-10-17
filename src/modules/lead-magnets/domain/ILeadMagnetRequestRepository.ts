import type { VerrouParBoite } from '../../../common/domain/verrou-par-boite';
import type { LeadMagnetRequest } from './LeadMagnetRequest';

export interface ILeadMagnetRequestRepository extends VerrouParBoite<ILeadMagnetRequestRepository> {
  create(data: LeadMagnetRequest): Promise<LeadMagnetRequest>;
  existeUneDemandeRecenteVersLaBoiteDe(
    email: string,
    formationSlug: string,
  ): Promise<boolean>;
  findByToken(accessToken: string): Promise<LeadMagnetRequest | null>;
}
