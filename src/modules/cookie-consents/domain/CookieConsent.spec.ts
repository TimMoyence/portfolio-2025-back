import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { CookieConsent } from './CookieConsent';

describe('CookieConsent aggregate', () => {
  it('creates consent with normalized locale', () => {
    const consent = CookieConsent.create({
      policyVersion: '2026-02-11',
      locale: 'EN-us',
      region: 'EU_UK',
      source: 'banner',
      action: 'accept_all',
      preferences: {
        essential: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
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
        policyVersion: '2026-02-11',
        locale: 'fr',
        region: 'EU_UK',
        source: 'banner',
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
});
