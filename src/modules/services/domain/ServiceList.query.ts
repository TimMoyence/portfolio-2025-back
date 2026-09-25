import { SortOrder } from '../../../common/domain/pagination.types';
import { ServiceStatus } from './Services';

type ServiceSortBy = 'order' | 'slug' | 'name' | 'createdAt';

export interface ServiceListQuery {
  page: number;
  limit: number;
  sortBy: ServiceSortBy;
  status?: ServiceStatus;
  order: SortOrder;
}
