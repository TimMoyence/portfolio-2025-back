import { SortOrder } from '../../../common/domain/pagination.types';
import { ProjectStatus, ProjectType } from './Projects';

export type ProjectSortBy = 'order' | 'slug' | 'type' | 'createdAt';

export interface ProjectListQuery {
  page: number;
  limit: number;
  sortBy: ProjectSortBy;
  type?: ProjectType;
  status?: ProjectStatus;
  order: SortOrder;
}
