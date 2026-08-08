import type { Provider } from '@nestjs/common';
import { CreateCoursesUseCase } from '../../src/modules/courses/application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../../src/modules/courses/application/ListCourses.useCase';
import { CoursesController } from '../../src/modules/courses/interfaces/Courses.controller';
import { CreateProjectsUseCase } from '../../src/modules/projects/application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../../src/modules/projects/application/ListProjects.useCase';
import { ProjectsController } from '../../src/modules/projects/interfaces/Projects.controller';
import { CreateRedirectsUseCase } from '../../src/modules/redirects/application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../../src/modules/redirects/application/ListRedirects.useCase';
import { RedirectsController } from '../../src/modules/redirects/interfaces/Redirects.controller';
import { CreateServicesUseCase } from '../../src/modules/services/application/CreateServices.useCase';
import { ListServicesUseCase } from '../../src/modules/services/application/ListServices.useCase';
import { ServicesController } from '../../src/modules/services/interfaces/Services.controller';

export const LEGACY_CONTROLLERS = [
  ServicesController,
  ProjectsController,
  CoursesController,
  RedirectsController,
];

export const LEGACY_SERVICE_PAYLOAD = {
  slug: 'technical-seo',
  name: 'Technical SEO',
  icon: '/icons/seo.svg',
  status: 'PUBLISHED',
  order: 2,
};

export const LEGACY_PROJECT_PAYLOAD = {
  slug: 'portfolio-site',
  type: 'SIDE',
  repoUrl: 'https://github.com/acme/portfolio',
  liveUrl: 'https://example.com',
  coverImage: '/images/portfolio.webp',
  gallery: ['/images/portfolio-1.webp'],
  stack: ['nestjs', 'postgres'],
  status: 'PUBLISHED',
  order: 1,
};

export const LEGACY_COURSE_PAYLOAD = {
  slug: 'ai-course',
  title: 'AI Course',
  summary: 'A premium course for practical AI delivery.',
  coverImage: '/images/ai-course.webp',
};

export const LEGACY_REDIRECT_PAYLOAD = {
  slug: 'promo-offer',
  targetUrl: 'https://example.com/promo',
  enabled: true,
  clicks: 0,
};

export const LEGACY_SERVICE = { id: 'service-1', ...LEGACY_SERVICE_PAYLOAD };
export const LEGACY_PROJECT = { id: 'project-1', ...LEGACY_PROJECT_PAYLOAD };
export const LEGACY_COURSE = { id: 'course-1', ...LEGACY_COURSE_PAYLOAD };
export const LEGACY_REDIRECT = { id: 'redirect-1', ...LEGACY_REDIRECT_PAYLOAD };

export const LEGACY_PAGE_META = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

export function legacyListResult<T>(
  item: T,
): { items: T[] } & typeof LEGACY_PAGE_META {
  return { items: [item], ...LEGACY_PAGE_META };
}

export function legacyListBody<T>(item: T): {
  items: T[];
  meta: typeof LEGACY_PAGE_META;
} {
  return { items: [item], meta: LEGACY_PAGE_META };
}

export const LEGACY_SERVICES_DEFAULT_QUERY = {
  page: 1,
  limit: 20,
  sortBy: 'order',
  status: undefined,
  order: 'ASC',
};

export const LEGACY_PROJECTS_DEFAULT_QUERY = {
  page: 1,
  limit: 20,
  sortBy: 'order',
  type: undefined,
  status: undefined,
  order: 'ASC',
};

export const LEGACY_COURSES_DEFAULT_QUERY = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  order: 'DESC',
};

export const LEGACY_REDIRECTS_DEFAULT_QUERY = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  enabled: undefined,
  order: 'DESC',
};

export const LEGACY_SERVICES_FILTERED_QUERY = {
  page: 2,
  limit: 5,
  sortBy: 'createdAt',
  status: 'DRAFT',
  order: 'DESC',
};

export const LEGACY_PROJECTS_FILTERED_QUERY = {
  page: 3,
  limit: 10,
  sortBy: 'type',
  type: 'SIDE',
  status: 'PUBLISHED',
  order: 'ASC',
};

export const LEGACY_REDIRECTS_FILTERED_QUERY = {
  page: 1,
  limit: 50,
  sortBy: 'clicks',
  enabled: false,
  order: 'DESC',
};

export interface LegacyUseCaseStubs {
  listServicesUseCase: { execute: jest.Mock };
  createServicesUseCase: { execute: jest.Mock };
  listProjectsUseCase: { execute: jest.Mock };
  createProjectsUseCase: { execute: jest.Mock };
  listCoursesUseCase: { execute: jest.Mock };
  createCoursesUseCase: { execute: jest.Mock };
  listRedirectsUseCase: { execute: jest.Mock };
  createRedirectsUseCase: { execute: jest.Mock };
}

export function createLegacyUseCaseStubs(): LegacyUseCaseStubs {
  return {
    listServicesUseCase: { execute: jest.fn() },
    createServicesUseCase: { execute: jest.fn() },
    listProjectsUseCase: { execute: jest.fn() },
    createProjectsUseCase: { execute: jest.fn() },
    listCoursesUseCase: { execute: jest.fn() },
    createCoursesUseCase: { execute: jest.fn() },
    listRedirectsUseCase: { execute: jest.fn() },
    createRedirectsUseCase: { execute: jest.fn() },
  };
}

export function legacyControllerProviders(
  stubs: LegacyUseCaseStubs,
): Provider[] {
  return [
    { provide: ListServicesUseCase, useValue: stubs.listServicesUseCase },
    { provide: CreateServicesUseCase, useValue: stubs.createServicesUseCase },
    { provide: ListProjectsUseCase, useValue: stubs.listProjectsUseCase },
    { provide: CreateProjectsUseCase, useValue: stubs.createProjectsUseCase },
    { provide: ListCoursesUseCase, useValue: stubs.listCoursesUseCase },
    { provide: CreateCoursesUseCase, useValue: stubs.createCoursesUseCase },
    { provide: ListRedirectsUseCase, useValue: stubs.listRedirectsUseCase },
    { provide: CreateRedirectsUseCase, useValue: stubs.createRedirectsUseCase },
  ];
}

export function primeLegacyUseCaseStubs(stubs: LegacyUseCaseStubs): void {
  stubs.listServicesUseCase.execute.mockResolvedValue(
    legacyListResult(LEGACY_SERVICE),
  );
  stubs.createServicesUseCase.execute.mockResolvedValue(LEGACY_SERVICE);
  stubs.listProjectsUseCase.execute.mockResolvedValue(
    legacyListResult(LEGACY_PROJECT),
  );
  stubs.createProjectsUseCase.execute.mockResolvedValue(LEGACY_PROJECT);
  stubs.listCoursesUseCase.execute.mockResolvedValue(
    legacyListResult(LEGACY_COURSE),
  );
  stubs.createCoursesUseCase.execute.mockResolvedValue(LEGACY_COURSE);
  stubs.listRedirectsUseCase.execute.mockResolvedValue(
    legacyListResult(LEGACY_REDIRECT),
  );
  stubs.createRedirectsUseCase.execute.mockResolvedValue(LEGACY_REDIRECT);
}
