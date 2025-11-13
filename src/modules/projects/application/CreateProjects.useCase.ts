import { Inject } from '@nestjs/common/decorators/core/inject.decorator';
import type { IProjectsRepository } from '../domain/IProjects.repository';
import { PROJECTS_REPOSITORY } from '../domain/Token';

export class CreateProjectsUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private repo: IProjectsRepository,
  ) {}
  async execute(data: any) {
    return this.repo.create(data);
  }
}
