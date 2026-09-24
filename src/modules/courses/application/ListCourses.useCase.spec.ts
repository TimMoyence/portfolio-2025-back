import { ListCoursesUseCase } from './ListCourses.useCase';
import type { ICoursesRepository } from '../domain/ICourses.repository';
import {
  buildCourse,
  createMockCoursesRepo,
} from '../../../../test/factories/courses.factory';
import { casDeListePaginee } from '../../../../test/factories/pagination.factory';

describe('ListCoursesUseCase', () => {
  it.each(
    casDeListePaginee<ICoursesRepository>({
      creerDepot: createMockCoursesRepo,
      creerUseCase: (depot) => new ListCoursesUseCase(depot),
      requete: { page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' },
      elements: [
        buildCourse(),
        buildCourse({ id: 'course-2', slug: 'formation-react' }),
      ],
    }),
  )('devrait retourner %s', (_cas, verifier) => verifier());
});
