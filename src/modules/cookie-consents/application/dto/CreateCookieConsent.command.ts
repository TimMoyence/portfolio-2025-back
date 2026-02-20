import type { CookieConsentPreferences } from '../../domain/CookieConsent';

export interface CreateCookieConsentCommand {
  policyVersion: string;
  locale: string;
  region: string;
  source: 'banner' | 'settings';
  action: 'accept_all' | 'essential_only' | 'save_preferences' | 'withdraw';
  preferences: CookieConsentPreferences;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}
