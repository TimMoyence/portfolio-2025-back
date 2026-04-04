import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { CookieConsent, type CreateCookieConsentProps } from './CookieConsent';

const VALID_PROPS: CreateCookieConsentProps = {
  policyVersion: '2026-02-11',
  locale: 'fr',
  region: 'EU_UK',
  source: 'banner',
  action: 'accept_all',
  preferences: {
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false,
  },
};

describe('CookieConsent aggregate', () => {
  it('creates consent with normalized locale', () => {
    const consent = CookieConsent.create({
      ...VALID_PROPS,
      locale: 'EN-us',
      ip: ' 203.0.113.10 ',
      userAgent: ' test-agent ',
      referer: ' https://example.com ',
    });

    expect(consent.locale).toBe('en');
    expect(consent.ip).toBe('203.0.113.10');
    expect(consent.userAgent).toBe('test-agent');
    expect(consent.referer).toBe('https://example.com');
  });

  it('throws when essential cookies are disabled', () => {
    expect(() =>
      CookieConsent.create({
        ...VALID_PROPS,
        action: 'essential_only',
        preferences: {
          essential: false,
          preferences: false,
          analytics: false,
          marketing: false,
        },
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Source validation ---

  it('devrait accepter settings comme source', () => {
    const consent = CookieConsent.create({
      ...VALID_PROPS,
      source: 'settings',
    });
    expect(consent.source).toBe('settings');
  });

  it('devrait refuser une source invalide', () => {
    expect(() =>
      CookieConsent.create({
        ...VALID_PROPS,
        source: 'invalid' as 'banner',
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Action validation ---

  it('devrait accepter toutes les actions valides', () => {
    const actions = [
      'accept_all',
      'essential_only',
      'save_preferences',
      'withdraw',
    ] as const;
    for (const action of actions) {
      const consent = CookieConsent.create({ ...VALID_PROPS, action });
      expect(consent.action).toBe(action);
    }
  });

  it('devrait refuser une action invalide', () => {
    expect(() =>
      CookieConsent.create({
        ...VALID_PROPS,
        action: 'invalid' as 'accept_all',
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Preferences validation ---

  it('devrait refuser des preferences nulles', () => {
    expect(() =>
      CookieConsent.create({
        ...VALID_PROPS,
        preferences: null as unknown as typeof VALID_PROPS.preferences,
      }),
    ).toThrow(DomainValidationError);
  });

  it('devrait refuser des preferences avec un champ non-boolean', () => {
    expect(() =>
      CookieConsent.create({
        ...VALID_PROPS,
        preferences: {
          essential: true,
          preferences: 'oui' as unknown as boolean,
          analytics: false,
          marketing: false,
        },
      }),
    ).toThrow(DomainValidationError);
  });

  // --- Optional metadata ---

  it('devrait gerer les metadonnees null/undefined', () => {
    const consent = CookieConsent.create({
      ...VALID_PROPS,
      ip: null,
      userAgent: undefined,
      referer: null,
    });
    expect(consent.ip).toBeNull();
    expect(consent.userAgent).toBeNull();
    expect(consent.referer).toBeNull();
  });

  // --- Locale resolution ---

  it('devrait defaulter la locale a fr si invalide', () => {
    const consent = CookieConsent.create({
      ...VALID_PROPS,
      locale: 'xx-invalid',
    });
    expect(consent.locale).toBe('fr');
  });
});
