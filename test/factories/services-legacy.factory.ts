import { Services } from '../../src/modules/services/domain/Services';
import type { IServicesRepository } from '../../src/modules/services/domain/IServices.repository';

export function buildService(overrides?: Partial<Services>): Services {
  const service = new Services();
  service.id = 'service-1';
  service.slug = 'developpement-web';
  service.name = 'Developpement Web';
  service.icon = 'code-bracket';
  service.status = 'PUBLISHED';
  service.order = 1;
  return Object.assign(service, overrides);
}

export function createMockServicesRepo(): jest.Mocked<IServicesRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
  };
}
