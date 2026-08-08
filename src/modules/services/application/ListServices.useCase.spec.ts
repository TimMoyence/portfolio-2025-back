/* eslint-disable @typescript-eslint/unbound-method */
import { ListServicesUseCase } from './ListServices.useCase';
import type { IServicesRepository } from '../domain/IServices.repository';
import type { ServiceListQuery } from '../domain/ServiceList.query';
import type { Services } from '../domain/Services';
import {
  buildService,
  createMockServicesRepo,
} from '../../../../test/factories/services-legacy.factory';
import { buildPaginatedResult } from '../../../../test/factories/pagination.factory';

describe('ListServicesUseCase', () => {
  let useCase: ListServicesUseCase;
  let repo: jest.Mocked<IServicesRepository>;

  const defaultQuery: ServiceListQuery = {
    page: 1,
    limit: 10,
    sortBy: 'order',
    order: 'ASC',
  };

  beforeEach(() => {
    repo = createMockServicesRepo();
    useCase = new ListServicesUseCase(repo);
  });

  it('devrait retourner la liste paginee depuis le repository', async () => {
    const services = [
      buildService(),
      buildService({ id: 'service-2', slug: 'design-ui' }),
    ];
    const expected = buildPaginatedResult(services);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucun service', async () => {
    const expected = buildPaginatedResult<Services>([]);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
