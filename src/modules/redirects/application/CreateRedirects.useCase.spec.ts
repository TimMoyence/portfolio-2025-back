/* eslint-disable @typescript-eslint/unbound-method */
import { CreateRedirectsUseCase } from './CreateRedirects.useCase';
import type { IRedirectsRepository } from '../domain/IRedirects.repository';
import { CreateRedirectCommand } from './dto/CreateRedirect.command';
import {
  buildRedirect,
  createMockRedirectsRepo,
} from '../../../../test/factories/redirects.factory';

describe('CreateRedirectsUseCase', () => {
  let useCase: CreateRedirectsUseCase;
  let repo: jest.Mocked<IRedirectsRepository>;

  const validCommand: CreateRedirectCommand = {
    slug: 'promo-ete',
    targetUrl: 'https://example.com/promotions/ete-2025',
  };

  beforeEach(() => {
    repo = createMockRedirectsRepo();
    useCase = new CreateRedirectsUseCase(repo);
  });

  it('devrait creer une redirection et la persister via le repository', async () => {
    const expectedRedirect = buildRedirect({
      slug: 'promo-ete',
      targetUrl: 'https://example.com/promotions/ete-2025',
    });
    repo.create.mockResolvedValue(expectedRedirect);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedRedirect);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
