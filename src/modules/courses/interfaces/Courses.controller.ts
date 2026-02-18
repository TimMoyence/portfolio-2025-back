import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCoursesUseCase } from '../application/CreateCourses.useCase';
import { Courses } from '../domain/Courses';

@Controller('courses')
export class CoursesController {
  constructor(private readonly createUseCase: CreateCoursesUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() dto: Courses) {
    return this.createUseCase.execute(dto);
  }
}
