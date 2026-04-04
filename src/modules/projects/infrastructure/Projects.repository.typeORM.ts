import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/domain/pagination.types';
import { IProjectsRepository } from '../domain/IProjects.repository';
import { ProjectListQuery, ProjectSortBy } from '../domain/ProjectList.query';
import { ProjectType, Projects } from '../domain/Projects';
import { ProjectsEntity } from './entities/Projects.entity';
import { ProjectType as ProjectTypeEnum } from './enums/ProjectType.enum';

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
      entities.map((e) => this.toDomain(e)),
      total,
      query.page,
      query.limit,
    );
  }

  async create(data: Projects): Promise<Projects> {
    const entity = this.repo.create({
      slug: data.slug,
      type: data.type as ProjectTypeEnum,
      repoUrl: data.repoUrl,
      liveUrl: data.liveUrl,
      coverImage: data.coverImage,
      gallery: data.gallery,
      stack: data.stack,
      status: data.status,
      order: data.order,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: ProjectsEntity): Projects {
    const project = new Projects();
    project.id = entity.id;
    project.slug = entity.slug;
    project.type = entity.type as ProjectType;
    project.repoUrl = entity.repoUrl;
    project.liveUrl = entity.liveUrl;
    project.coverImage = entity.coverImage;
    project.gallery = entity.gallery ?? [];
    project.stack = entity.stack ?? [];
    project.status = entity.status;
    project.order = entity.order;
    return project;
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
