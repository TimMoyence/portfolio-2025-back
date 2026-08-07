import { Inject, Injectable } from '@nestjs/common';
import { Courses } from '../domain/Courses';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import { COURSES_REPOSITORY } from '../domain/token';
import { CreateCourseCommand } from './dto/CreateCourse.command';
import { CourseMapper } from './mappers/Course.mapper';

@Injectable()
export class CreateCoursesUseCase {
  constructor(
    @Inject(COURSES_REPOSITORY)
    private readonly repo: ICoursesRepository,
  ) {}

  async execute(data: CreateCourseCommand): Promise<Courses> {
    const course = CourseMapper.fromCreateCommand(data);
    return this.repo.create(course);
  }
}
