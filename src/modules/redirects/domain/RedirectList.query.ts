import { SortOrder } from '../../../common/domain/pagination.types';

export type RedirectSortBy = 'slug' | 'clicks' | 'createdAt';

export interface RedirectListQuery {
  page: number;
  limit: number;
  sortBy: RedirectSortBy;
  enabled?: boolean;
  order: SortOrder;
}
