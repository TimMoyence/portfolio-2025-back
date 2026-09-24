import { ListServicesUseCase } from './ListServices.useCase';
import type { IServicesRepository } from '../domain/IServices.repository';
import {
  buildService,
  createMockServicesRepo,
} from '../../../../test/factories/services-legacy.factory';
import { casDeListePaginee } from '../../../../test/factories/pagination.factory';

describe('ListServicesUseCase', () => {
  it.each(
    casDeListePaginee<IServicesRepository>({
      creerDepot: createMockServicesRepo,
      creerUseCase: (depot) => new ListServicesUseCase(depot),
      requete: { page: 1, limit: 10, sortBy: 'order', order: 'ASC' },
      elements: [
        buildService(),
        buildService({ id: 'service-2', slug: 'design-ui' }),
      ],
    }),
  )('devrait retourner %s', (_cas, verifier) => verifier());
});
