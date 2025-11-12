import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsEntity } from './infrastructure/entities/Projects.entity';
import { ProjectsRepositoryTypeORM } from './infrastructure/ProjectsRepositoryTypeORM';
import { ProjectsController } from './interfaces/ProjectsController';
import { PROJECTS_REPOSITORY } from './domain/Token';
import { CreateProjectsUseCase } from './application/CreateProjectsUseCase';

const PROJECTS_USE_CASES = [CreateProjectsUseCase];

@Module({
  imports: [TypeOrmModule.forFeature([ProjectsEntity])],
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
