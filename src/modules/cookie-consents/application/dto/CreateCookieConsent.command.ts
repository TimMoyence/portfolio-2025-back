import type { Provenance } from '../../../../common/domain/provenance';
import type { CookieConsentPreferences } from '../../domain/CookieConsent';

export interface CreateCookieConsentCommand extends Provenance {
  policyVersion: string;
  locale: string;
  region: string;
  source: 'banner' | 'settings';
  action: 'accept_all' | 'essential_only' | 'save_preferences' | 'withdraw';
  preferences: CookieConsentPreferences;
}
