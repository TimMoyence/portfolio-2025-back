import { ListRedirectsUseCase } from './ListRedirects.useCase';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import {
  buildRedirect,
  createMockRedirectsRepo,
} from '../../../../test/factories/redirects.factory';
import { casDeListePaginee } from '../../../../test/factories/pagination.factory';

describe('ListRedirectsUseCase', () => {
  it.each(
    casDeListePaginee<IRedirectsRepository>({
      creerDepot: createMockRedirectsRepo,
      creerUseCase: (depot) => new ListRedirectsUseCase(depot),
      requete: { page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' },
      elements: [
        buildRedirect(),
        buildRedirect({ id: 'redirect-2', slug: 'autre-lien' }),
      ],
    }),
  )('devrait retourner %s', (_cas, verifier) => verifier());
});
