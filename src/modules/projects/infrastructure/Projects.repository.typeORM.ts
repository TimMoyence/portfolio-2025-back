import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotPagine } from '../../../common/infrastructure/typeorm/page-de-requete';
import { IProjectsRepository } from '../domain/IProjects.repository';
import { ProjectListQuery } from '../domain/ProjectList.query';
import { ProjectType, Projects } from '../domain/Projects';
import { ProjectsEntity } from './entities/Projects.entity';
import { ProjectType as ProjectTypeEnum } from './enums/ProjectType.enum';

@Injectable()
export class ProjectsRepositoryTypeORM
  extends DepotPagine<ProjectsEntity, Projects, ProjectListQuery>
  implements IProjectsRepository
{
  constructor(
    @InjectRepository(ProjectsEntity)
    repo: Repository<ProjectsEntity>,
  ) {
    super(repo, {
      alias: 'project',
      colonnes: ['order', 'slug', 'type', 'createdAt'],
      parDefaut: 'order',
      filtres: (query) => ({ type: query.type, status: query.status }),
    });
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

  protected toDomain(entity: ProjectsEntity): Projects {
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
}
