import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { estObjet } from '../../../common/domain/est-objet';
import {
  provenanceConsignable,
  type Provenance,
} from '../../../common/domain/provenance';
import {
  requireLocale,
  requireText,
} from '../../../common/domain/validation/domain-validators';

export interface CookieConsentPreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const SOURCES_DE_CONSENTEMENT = ['banner', 'settings'] as const;
export const ACTIONS_DE_CONSENTEMENT = [
  'accept_all',
  'essential_only',
  'save_preferences',
  'withdraw',
] as const;

type CookieConsentSource = (typeof SOURCES_DE_CONSENTEMENT)[number];
type CookieConsentAction = (typeof ACTIONS_DE_CONSENTEMENT)[number];

export interface CreateCookieConsentProps extends Provenance {
  policyVersion: string;
  locale: string;
  region: string;
  source: CookieConsentSource;
  action: CookieConsentAction;
  preferences: CookieConsentPreferences;
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

  static create(props: CreateCookieConsentProps): CookieConsent {
    const policyVersion = requireText(
      props.policyVersion,
      'cookie consent policy version',
      1,
      50,
    );
    const locale = requireLocale(props.locale, 'cookie consent locale');
    const region = requireText(props.region, 'cookie consent region', 1, 20);

    if (
      !(SOURCES_DE_CONSENTEMENT as readonly string[]).includes(props.source)
    ) {
      throw new DomainValidationError('Invalid cookie consent source');
    }

    if (
      !(ACTIONS_DE_CONSENTEMENT as readonly string[]).includes(props.action)
    ) {
      throw new DomainValidationError('Invalid cookie consent action');
    }

    const preferences = props.preferences;
    if (
      !estObjet(preferences) ||
      typeof preferences.essential !== 'boolean' ||
      typeof preferences.preferences !== 'boolean' ||
      typeof preferences.analytics !== 'boolean' ||
      typeof preferences.marketing !== 'boolean'
    ) {
      throw new DomainValidationError('Invalid cookie consent preferences');
    }

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
    Object.assign(consent, provenanceConsignable(props));

    return consent;
  }
}
