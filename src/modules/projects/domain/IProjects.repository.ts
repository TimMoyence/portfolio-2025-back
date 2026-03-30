import { PaginatedResult } from '../../../common/domain/pagination.types';
import { ProjectListQuery } from './ProjectList.query';
import { Projects } from './Projects';

/** Port de persistance pour les projets. */
export interface IProjectsRepository {
  findAll(query: ProjectListQuery): Promise<PaginatedResult<Projects>>;
  create(data: Projects): Promise<Projects>;
}
