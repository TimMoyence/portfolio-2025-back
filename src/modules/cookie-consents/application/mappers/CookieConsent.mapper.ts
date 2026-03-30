import { mapDomainValidation } from '../../../../common/application/mappers/map-domain-validation';
import { CookieConsent } from '../../domain/CookieConsent';
import { CreateCookieConsentCommand } from '../dto/CreateCookieConsent.command';

export class CookieConsentMapper {
  static fromCreateCommand(command: CreateCookieConsentCommand): CookieConsent {
    return mapDomainValidation(() => CookieConsent.create(command));
  }
}
