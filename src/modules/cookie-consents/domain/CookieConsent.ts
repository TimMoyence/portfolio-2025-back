import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  requireText,
  optionalMetadata,
} from '../../../common/domain/validation/domain-validators';
import { LocaleCode } from '../../../common/domain/value-objects/LocaleCode';

export interface CookieConsentPreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export type CookieConsentSource = 'banner' | 'settings';
export type CookieConsentAction =
  | 'accept_all'
  | 'essential_only'
  | 'save_preferences'
  | 'withdraw';

export interface CreateCookieConsentProps {
  policyVersion: string;
  locale: string;
  region: string;
  source: CookieConsentSource;
  action: CookieConsentAction;
  preferences: CookieConsentPreferences;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

/** Entite domaine representant un consentement cookies conforme RGPD. */
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

  static create(props: CreateCookieConsentProps): CookieConsent {
    const policyVersion = requireText(
      props.policyVersion,
      'cookie consent policy version',
      1,
      50,
    );
    const locale = LocaleCode.resolve(props.locale, 'fr').value;
    const region = requireText(props.region, 'cookie consent region', 1, 20);

    if (!['banner', 'settings'].includes(props.source)) {
      throw new DomainValidationError('Invalid cookie consent source');
    }

    if (
      ![
        'accept_all',
        'essential_only',
        'save_preferences',
        'withdraw',
      ].includes(props.action)
    ) {
      throw new DomainValidationError('Invalid cookie consent action');
    }

    const preferences = props.preferences;
    if (
      !preferences ||
      typeof preferences !== 'object' ||
      typeof preferences.essential !== 'boolean' ||
      typeof preferences.preferences !== 'boolean' ||
      typeof preferences.analytics !== 'boolean' ||
      typeof preferences.marketing !== 'boolean'
    ) {
      throw new DomainValidationError('Invalid cookie consent preferences');
    }

    // Essential cookies are mandatory for consent snapshots.
    if (preferences.essential !== true) {
      throw new DomainValidationError('Essential cookie flag must be true');
    }

    const consent = new CookieConsent();
    consent.policyVersion = policyVersion;
    consent.locale = locale;
    consent.region = region;
    consent.source = props.source;
    consent.action = props.action;
    consent.preferences = preferences;
    consent.ip = optionalMetadata(props.ip);
    consent.userAgent = optionalMetadata(props.userAgent);
    consent.referer = optionalMetadata(props.referer);

    return consent;
  }
}
