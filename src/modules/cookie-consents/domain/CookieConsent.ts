export interface CookieConsentPreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export class CookieConsent {
  id?: string;
  policyVersion: string;
  locale: string;
  region: string;
  source: string;
  action: string;
  preferences: CookieConsentPreferences;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}
