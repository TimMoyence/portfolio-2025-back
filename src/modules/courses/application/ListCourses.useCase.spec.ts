/* eslint-disable @typescript-eslint/unbound-method */
import { ListCoursesUseCase } from './ListCourses.useCase';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import type { CourseListQuery } from '../domain/CourseList.query';
import type { Courses } from '../domain/Courses';
import {
  buildCourse,
  createMockCoursesRepo,
} from '../../../../test/factories/courses.factory';
import { buildPaginatedResult } from '../../../../test/factories/pagination.factory';

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
    const expected = buildPaginatedResult(courses);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });

  it('devrait retourner une liste vide si aucune formation', async () => {
    const expected = buildPaginatedResult<Courses>([]);
    repo.findAll.mockResolvedValue(expected);

    const result = await useCase.execute(defaultQuery);

    expect(result).toEqual(expected);
    expect(repo.findAll).toHaveBeenCalledWith(defaultQuery);
  });
});
