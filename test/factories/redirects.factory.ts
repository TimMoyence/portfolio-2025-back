import { Redirects } from '../../src/modules/redirects/domain/Redirects';
import type { IRedirectsRepository } from '../../src/modules/redirects/domain/IRedirects.repository';

/** Construit un objet Redirects domaine avec des valeurs par defaut. */
export function buildRedirect(overrides?: Partial<Redirects>): Redirects {
  const redirect = new Redirects();
  redirect.id = 'redirect-1';
  redirect.slug = 'mon-lien';
  redirect.targetUrl = 'https://example.com/page-destination';
  redirect.enabled = true;
  redirect.clicks = 42;
  return Object.assign(redirect, overrides);
}

/** Cree un mock complet du repository redirects. */
export function createMockRedirectsRepo(): jest.Mocked<IRedirectsRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
  };
}
