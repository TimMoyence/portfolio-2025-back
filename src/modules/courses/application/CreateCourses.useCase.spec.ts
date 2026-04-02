/* eslint-disable @typescript-eslint/unbound-method */
import { CreateCoursesUseCase } from './CreateCourses.useCase';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import { CreateCourseCommand } from './dto/CreateCourse.command';
import {
  buildCourse,
  createMockCoursesRepo,
} from '../../../../test/factories/courses.factory';

describe('CreateCoursesUseCase', () => {
  let useCase: CreateCoursesUseCase;
  let repo: jest.Mocked<ICoursesRepository>;

  const validCommand: CreateCourseCommand = {
    slug: 'formation-angular',
    title: 'Formation Angular 19',
    summary:
      'Decouvrez les fondamentaux et les nouveautes d Angular 19 avec des exercices pratiques.',
  };

  beforeEach(() => {
    repo = createMockCoursesRepo();
    useCase = new CreateCoursesUseCase(repo);
  });

  it('devrait creer une formation et la persister via le repository', async () => {
    const expectedCourse = buildCourse({
      slug: 'formation-angular',
      title: 'Formation Angular 19',
    });
    repo.create.mockResolvedValue(expectedCourse);

    const result = await useCase.execute(validCommand);

    expect(result).toEqual(expectedCourse);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
