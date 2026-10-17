import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { buildChoixDeConsentement } from '../../../../test/factories/cookie-consents.factory';
import {
  attendreUneProvenanceBornee,
  PROVENANCE_DEMESUREE,
} from '../../../../test/helpers/provenance';
import { CookieConsent } from './CookieConsent';

const VALID_PROPS = buildChoixDeConsentement();

describe('CookieConsent aggregate', () => {
  it('creates consent with its locale and trimmed request metadata', () => {
    const consent = CookieConsent.create({
      ...VALID_PROPS,
      locale: 'en',
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

  it.each(['essential', 'preferences', 'analytics', 'marketing'] as const)(
    'refuse le choix %s transmis en texte en nommant les preferences',
    (choix) => {
      expect(() =>
        CookieConsent.create({
          ...VALID_PROPS,
          preferences: {
            ...VALID_PROPS.preferences,
            [choix]: 'true' as unknown as boolean,
          },
        }),
      ).toThrow('Invalid cookie consent preferences');
    },
  );

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

  it('borne la provenance consignée', () => {
    attendreUneProvenanceBornee(
      CookieConsent.create({ ...VALID_PROPS, ...PROVENANCE_DEMESUREE }),
    );
  });

  it.each([['xx-invalid'], ['de'], [''], ['EN-us']])(
    'refuse la locale non supportee %p au lieu de la remplacer par fr',
    (locale) => {
      expect(() => CookieConsent.create({ ...VALID_PROPS, locale })).toThrow(
        new DomainValidationError('Invalid cookie consent locale'),
      );
    },
  );
});
