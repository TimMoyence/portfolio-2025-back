import { PaginatedResult } from '../../../common/domain/pagination.types';
import { ServiceListQuery } from './ServiceList.query';
import { Services } from './Services';

/** Port de persistance pour les services. */
export interface IServicesRepository {
  findAll(query: ServiceListQuery): Promise<PaginatedResult<Services>>;
  create(data: Services): Promise<Services>;
}
