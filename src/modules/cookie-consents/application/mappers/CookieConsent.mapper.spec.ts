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

  it('garde la locale supportee du consentement', () => {
    const mapped = CookieConsentMapper.fromCreateCommand({
      ...baseCommand,
      locale: 'en',
    });

    expect(mapped.locale).toBe('en');
  });

  it.each([['es'], ['EN-us']])(
    'refuse par un 400 la locale %p au lieu de la remplacer par fr',
    (locale) => {
      expect(() =>
        CookieConsentMapper.fromCreateCommand({
          ...baseCommand,
          locale,
        }),
      ).toThrow(new BadRequestException('Invalid cookie consent locale'));
    },
  );
});
