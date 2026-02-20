import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { CourseListQuery } from '../domain/CourseList.query';
import type { Courses } from '../domain/Courses';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import { COURSES_REPOSITORY } from '../domain/token';

@Injectable()
export class ListCoursesUseCase {
  constructor(
    @Inject(COURSES_REPOSITORY)
    private readonly repo: ICoursesRepository,
  ) {}

  execute(query: CourseListQuery): Promise<PaginatedResult<Courses>> {
    return this.repo.findAll(query);
  }
}
