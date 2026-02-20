import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProjectsUseCase } from './application/CreateProjects.useCase';
import { ListProjectsUseCase } from './application/ListProjects.useCase';
import { PROJECTS_REPOSITORY } from './domain/token';
import { ProjectsEntity } from './infrastructure/entities/Projects.entity';
import { ProjectsTranslationsEntity } from './infrastructure/entities/ProjectsTranslations.entity';
import { ProjectsRepositoryTypeORM } from './infrastructure/Projects.repository.typeORM';
import { ProjectsController } from './interfaces/Projects.controller';

const PROJECTS_USE_CASES = [ListProjectsUseCase, CreateProjectsUseCase];

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectsEntity, ProjectsTranslationsEntity]),
  ],
  controllers: [ProjectsController],
  providers: [
    ...PROJECTS_USE_CASES,
    {
      provide: PROJECTS_REPOSITORY,
      useClass: ProjectsRepositoryTypeORM,
    },
  ],
  exports: [PROJECTS_REPOSITORY],
})
export class ProjectsModule {}
