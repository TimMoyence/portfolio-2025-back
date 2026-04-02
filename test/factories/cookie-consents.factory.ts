import type { ICookieConsentsRepository } from '../../src/modules/cookie-consents/domain/ICookieConsents.repository';
import { CookieConsentResponse } from '../../src/modules/cookie-consents/domain/CookieConsentResponse';
import type { CreateCookieConsentCommand } from '../../src/modules/cookie-consents/application/dto/CreateCookieConsent.command';

/** Construit une commande de creation de consentement cookies avec des valeurs par defaut. */
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

/** Construit une reponse de consentement cookies avec des valeurs par defaut. */
export function buildCookieConsentResponse(
  overrides?: Partial<CookieConsentResponse>,
): CookieConsentResponse {
  const response = new CookieConsentResponse();
  response.message = 'Consentement enregistre';
  return Object.assign(response, overrides);
}

/** Cree un mock complet du repository de consentements cookies. */
export function createMockCookieConsentsRepo(): jest.Mocked<ICookieConsentsRepository> {
  return {
    create: jest.fn(),
  };
}
