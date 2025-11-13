import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCoursesUseCase } from '../application/CreateCourses.useCase';

@Controller('courses')
export class CoursesController {
  constructor(private readonly createUseCase: CreateCoursesUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: any) {
    return this.createUseCase.execute(dto);
  }
}
