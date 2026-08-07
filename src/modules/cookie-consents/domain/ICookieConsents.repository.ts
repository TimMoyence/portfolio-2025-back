import { CookieConsent } from './CookieConsent';
import { CookieConsentResponse } from './CookieConsentResponse';

export interface ICookieConsentsRepository {
  create(data: CookieConsent): Promise<CookieConsentResponse>;
}
