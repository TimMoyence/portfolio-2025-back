import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProjectsUseCase } from '../application/CreateProjects.useCase';
import { Projects } from '../domain/Projects';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly createUseCase: CreateProjectsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: Projects) {
    return this.createUseCase.execute(dto);
  }
}
