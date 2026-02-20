import { CreateCookieConsentCommand } from '../dto/CreateCookieConsent.command';
import { CookieConsentMapper } from './CookieConsent.mapper';

describe('CookieConsentMapper', () => {
  const baseCommand: CreateCookieConsentCommand = {
    policyVersion: '2026-02-11',
    locale: 'fr',
    region: 'EU_UK',
    source: 'banner',
    action: 'accept_all',
    preferences: {
      essential: true,
      preferences: true,
      analytics: false,
      marketing: false,
    },
    ip: null,
    userAgent: null,
    referer: null,
  };

  it('normalizes locale variant to supported locale', () => {
    const mapped = CookieConsentMapper.fromCreateCommand({
      ...baseCommand,
      locale: 'EN-us',
    });

    expect(mapped.locale).toBe('en');
  });

  it('falls back to french locale for unsupported input', () => {
    const mapped = CookieConsentMapper.fromCreateCommand({
      ...baseCommand,
      locale: 'es',
    });

    expect(mapped.locale).toBe('fr');
  });
});
