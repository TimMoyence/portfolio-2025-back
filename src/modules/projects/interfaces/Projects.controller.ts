import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateProjectsUseCase } from '../application/CreateProjects.useCase';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly createUseCase: CreateProjectsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: any) {
    return this.createUseCase.execute(dto);
  }
}
