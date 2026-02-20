export type SortOrder = 'ASC' | 'DESC';

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const safeLimit = Math.max(1, limit);
  return {
    items,
    total,
    page,
    limit: safeLimit,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
}
