import type { ICookieConsentsRepository } from '../../src/modules/cookie-consents/domain/ICookieConsents.repository';
import { CookieConsentResponse } from '../../src/modules/cookie-consents/domain/CookieConsentResponse';
import type { CreateCookieConsentCommand } from '../../src/modules/cookie-consents/application/dto/CreateCookieConsent.command';
import type { CreateCookieConsentProps } from '../../src/modules/cookie-consents/domain/CookieConsent';

export function buildCookieConsentCommand(
  overrides?: Partial<CreateCookieConsentCommand>,
): CreateCookieConsentCommand {
  return {
    policyVersion: '1.0',
    locale: 'fr',
    region: 'EU',
    source: 'banner',
    action: 'accept_all',
    preferences: {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: false,
    },
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    referer: null,
    ...overrides,
  };
}

export function buildChoixDeConsentement(
  overrides?: Partial<CreateCookieConsentProps>,
): CreateCookieConsentProps {
  return {
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
    ...overrides,
  };
}

export function buildCookieConsentResponse(
  overrides?: Partial<CookieConsentResponse>,
): CookieConsentResponse {
  const response = new CookieConsentResponse();
  response.message = 'Consentement enregistre';
  return Object.assign(response, overrides);
}

export function createMockCookieConsentsRepo(): jest.Mocked<ICookieConsentsRepository> {
  return {
    create: jest.fn(),
  };
}
