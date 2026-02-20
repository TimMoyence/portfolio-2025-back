import { Inject, Injectable } from '@nestjs/common';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import { Projects } from '../domain/Projects';
import { PROJECTS_REPOSITORY } from '../domain/token';
import { CreateProjectCommand } from './dto/CreateProject.command';
import { ProjectMapper } from './mappers/Project.mapper';

@Injectable()
export class CreateProjectsUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private repo: IProjectsRepository,
  ) {}

  async execute(data: CreateProjectCommand): Promise<Projects> {
    const project = ProjectMapper.fromCreateCommand(data);
    return this.repo.create(project);
  }
}
