import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { LeadMagnetRequest } from '../../domain/LeadMagnetRequest';
import type { RequestToolkitCommand } from '../dto/RequestToolkit.command';

/** Mappe une commande RequestToolkit vers l'entite domaine LeadMagnetRequest. */
export class LeadMagnetRequestMapper {
  static fromCommand(command: RequestToolkitCommand): LeadMagnetRequest {
    return mapDomainValidation(() =>
      LeadMagnetRequest.create({
        firstName: command.firstName,
        email: command.email,
        formationSlug: command.formationSlug,
        termsVersion: command.termsVersion,
        termsLocale: command.termsLocale,
        termsAcceptedAt: command.termsAcceptedAt,
        profile: command.profile,
      }),
    );
  }
}
