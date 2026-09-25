import { SortOrder } from '../../../common/domain/pagination.types';

type CourseSortBy = 'slug' | 'title' | 'createdAt';

export interface CourseListQuery {
  page: number;
  limit: number;
  sortBy: CourseSortBy;
  order: SortOrder;
}
