/* eslint-disable @typescript-eslint/unbound-method */
import { ListRedirectsUseCase } from './ListRedirects.useCase';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import type { RedirectListQuery } from '../domain/RedirectList.query';
import type { Redirects } from '../domain/Redirects';
import {
  buildRedirect,
  createMockRedirectsRepo,
} from '../../../../test/factories/redirects.factory';
import { buildPaginatedResult } from '../../../../test/factories/pagination.factory';

describe('ListRedirectsUseCase', () => {
  let useCase: ListRedirectsUseCase;
  let repo: jest.Mocked<IRedirectsRepository>;

  const defaultQuery: RedirectListQuery = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'DESC',
  };

  beforeEach(() => {
    repo = createMockRedirectsRepo();
    useCase = new ListRedirectsUseCase(repo);
  });

  it('devrait retourner la liste paginee depuis le repository', async () => {
    const redirects = [
      buildRedirect(),
      buildRedirect({ id: 'redirect-2', slug: 'autre-lien' }),
    ];
    const expected = buildPaginatedResult(redirects);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucune redirection', async () => {
    const expected = buildPaginatedResult<Redirects>([]);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
