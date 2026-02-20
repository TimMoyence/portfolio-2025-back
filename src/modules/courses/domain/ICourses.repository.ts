import { PaginatedResult } from '../../../common/domain/pagination.types';
import { CourseListQuery } from './CourseList.query';
import { Courses } from './Courses';

export interface ICoursesRepository {
  findAll(query: CourseListQuery): Promise<PaginatedResult<Courses>>;
  create(data: Courses): Promise<Courses>;
}
