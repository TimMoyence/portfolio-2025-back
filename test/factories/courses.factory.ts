import { Courses } from '../../src/modules/courses/domain/Courses';
import type { ICoursesRepository } from '../../src/modules/courses/domain/ICourses.repository';

/** Construit un objet Courses domaine avec des valeurs par defaut. */
export function buildCourse(overrides?: Partial<Courses>): Courses {
  const course = new Courses();
  course.id = 'course-1';
  course.slug = 'formation-nestjs';
  course.title = 'Formation NestJS avancee';
  course.summary =
    'Une formation complete sur NestJS couvrant les modules, providers et middleware.';
  course.coverImage = 'https://example.com/nestjs-cover.png';
  return Object.assign(course, overrides);
}

/** Cree un mock complet du repository courses. */
export function createMockCoursesRepo(): jest.Mocked<ICoursesRepository> {
  return {
    findAll: jest.fn(),
    create: jest.fn(),
  };
}
