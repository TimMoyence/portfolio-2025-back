/* eslint-disable @typescript-eslint/unbound-method */
import { CreateServicesUseCase } from './CreateServices.useCase';
import type { IServicesRepository } from '../domain/IServices.repository';
import { CreateServiceCommand } from './dto/CreateService.command';
import {
  buildService,
  createMockServicesRepo,
} from '../../../../test/factories/services-legacy.factory';

describe('CreateServicesUseCase', () => {
  let useCase: CreateServicesUseCase;
  let repo: jest.Mocked<IServicesRepository>;

  const validCommand: CreateServiceCommand = {
    slug: 'consulting-tech',
    name: 'Consulting Technique',
    icon: 'light-bulb',
    status: 'PUBLISHED',
    order: 3,
  };

  beforeEach(() => {
    repo = createMockServicesRepo();
    useCase = new CreateServicesUseCase(repo);
  });

  it('devrait creer un service et le persister via le repository', async () => {
    const expectedService = buildService({
      slug: 'consulting-tech',
      name: 'Consulting Technique',
    });
    repo.create.mockResolvedValue(expectedService);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedService);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
