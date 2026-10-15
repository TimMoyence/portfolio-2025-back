import { BadRequestException } from '@nestjs/common';
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

  it('refuse par un 400 une locale non supportee au lieu de la remplacer par fr', () => {
    expect(() =>
      CookieConsentMapper.fromCreateCommand({
        ...baseCommand,
        locale: 'es',
      }),
    ).toThrow(new BadRequestException('Invalid cookie consent locale'));
  });
});
