import { CookieConsent } from './CookieConsent';
import { CookieConsentResponse } from './CookieConsentResponse';

/** Port de persistance pour les consentements cookies. */
export interface ICookieConsentsRepository {
  create(data: CookieConsent): Promise<CookieConsentResponse>;
}
