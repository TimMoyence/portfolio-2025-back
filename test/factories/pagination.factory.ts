import type { PaginatedResult } from '../../src/common/domain/pagination.types';

export function buildPaginatedResult<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    page: 1,
    limit: 10,
    total: items.length,
    totalPages: items.length === 0 ? 0 : 1,
  };
}
