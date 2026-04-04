/* eslint-disable @typescript-eslint/unbound-method */
import { ListCoursesUseCase } from './ListCourses.useCase';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import type { CourseListQuery } from '../domain/CourseList.query';
import type { PaginatedResult } from '../../../common/domain/pagination.types';
import type { Courses } from '../domain/Courses';
import {
  buildCourse,
  createMockCoursesRepo,
} from '../../../../test/factories/courses.factory';

describe('ListCoursesUseCase', () => {
  let useCase: ListCoursesUseCase;
  let repo: jest.Mocked<ICoursesRepository>;

  const defaultQuery: CourseListQuery = {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'DESC',
  };

  beforeEach(() => {
    repo = createMockCoursesRepo();
    useCase = new ListCoursesUseCase(repo);
  });

  it('devrait retourner la liste paginee depuis le repository', async () => {
    const courses = [
      buildCourse(),
      buildCourse({ id: 'course-2', slug: 'formation-react' }),
    ];
    const expected: PaginatedResult<Courses> = {
      items: courses,
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    };
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucune formation', async () => {
    const expected: PaginatedResult<Courses> = {
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
