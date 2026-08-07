import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import type { ProjectListQuery } from '../domain/ProjectList.query';
import type { Projects } from '../domain/Projects';
import { PROJECTS_REPOSITORY } from '../domain/token';

@Injectable()
export class ListProjectsUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly repo: IProjectsRepository,
  ) {}

  execute(query: ProjectListQuery): Promise<PaginatedResult<Projects>> {
    return this.repo.findAll(query);
  }
}
