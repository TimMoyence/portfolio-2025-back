import { buildChoixDeConsentement } from '../../../../../test/factories/cookie-consents.factory';
import { CreateCookieConsentCommand } from '../dto/CreateCookieConsent.command';
import { CookieConsentMapper } from './CookieConsent.mapper';

describe('CookieConsentMapper', () => {
  const baseCommand: CreateCookieConsentCommand = {
    ...buildChoixDeConsentement(),
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
