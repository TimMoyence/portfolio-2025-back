import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
import { IProjectsRepository } from '../domain/IProjects.repository';
import { ProjectListQuery, ProjectSortBy } from '../domain/ProjectList.query';
import { Projects } from '../domain/Projects';
import { ProjectsEntity } from './entities/Projects.entity';

@Injectable()
export class ProjectsRepositoryTypeORM implements IProjectsRepository {
  constructor(
    @InjectRepository(ProjectsEntity)
    private readonly repo: Repository<ProjectsEntity>,
  ) {}

  async findAll(query: ProjectListQuery): Promise<PaginatedResult<Projects>> {
    const qb = this.repo.createQueryBuilder('project');
    if (query.type) {
      qb.andWhere('project.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('project.status = :status', { status: query.status });
    }

    const [entities, total] = await qb
      .orderBy(this.resolveSortColumn(query.sortBy), query.order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return createPaginatedResult(
      entities as unknown as Projects[],
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Projects): Promise<Projects> {
    const saved = await this.repo.save(
      data as unknown as Partial<ProjectsEntity>,
    );
    return saved as unknown as Projects;
  }

  private resolveSortColumn(sortBy: ProjectSortBy): string {
    switch (sortBy) {
      case 'slug':
        return 'project.slug';
      case 'type':
        return 'project.type';
      case 'createdAt':
        return 'project.createdAt';
      case 'order':
      default:
        return 'project.order';
    }
  }
}
