import type { Provider, Type } from '@nestjs/common';
import { CreateCoursesUseCase } from '../../src/modules/courses/application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../../src/modules/courses/application/ListCourses.useCase';
import { CoursesController } from '../../src/modules/courses/interfaces/Courses.controller';
import { CourseListQueryDto } from '../../src/modules/courses/interfaces/dto/course-list.query.dto';
import { CourseRequestDto } from '../../src/modules/courses/interfaces/dto/course.request.dto';
import { CreateProjectsUseCase } from '../../src/modules/projects/application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../../src/modules/projects/application/ListProjects.useCase';
import { ProjectsController } from '../../src/modules/projects/interfaces/Projects.controller';
import { ProjectListQueryDto } from '../../src/modules/projects/interfaces/dto/project-list.query.dto';
import { ProjectRequestDto } from '../../src/modules/projects/interfaces/dto/project.request.dto';
import { CreateRedirectsUseCase } from '../../src/modules/redirects/application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../../src/modules/redirects/application/ListRedirects.useCase';
import { RedirectsController } from '../../src/modules/redirects/interfaces/Redirects.controller';
import { RedirectListQueryDto } from '../../src/modules/redirects/interfaces/dto/redirect-list.query.dto';
import { RedirectRequestDto } from '../../src/modules/redirects/interfaces/dto/redirect.request.dto';
import { CreateServicesUseCase } from '../../src/modules/services/application/CreateServices.useCase';
import { ListServicesUseCase } from '../../src/modules/services/application/ListServices.useCase';
import { ServicesController } from '../../src/modules/services/interfaces/Services.controller';
import { ServiceListQueryDto } from '../../src/modules/services/interfaces/dto/service-list.query.dto';
import { ServiceRequestDto } from '../../src/modules/services/interfaces/dto/service.request.dto';

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

const LEGACY_PAGE_META = {
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
};

function legacyListResult<T>(
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

interface UseCaseSimule {
  execute: jest.Mock;
}

export interface LegacyUseCaseStubs {
  listServicesUseCase: UseCaseSimule;
  createServicesUseCase: UseCaseSimule;
  listProjectsUseCase: UseCaseSimule;
  createProjectsUseCase: UseCaseSimule;
  listCoursesUseCase: UseCaseSimule;
  createCoursesUseCase: UseCaseSimule;
  listRedirectsUseCase: UseCaseSimule;
  createRedirectsUseCase: UseCaseSimule;
}

export interface ControleurLegacy {
  findAll(query: object): Promise<unknown>;
  create(payload: object): Promise<unknown>;
}

export interface ContexteLegacy {
  readonly route: string;
  readonly controleur: Type<unknown>;
  readonly listQueryDto: new () => object;
  readonly requestDto: new () => object;
  readonly payload: object;
  readonly entite: object;
  readonly requeteParDefaut: Readonly<Record<string, unknown>>;
  readonly filtre?: {
    readonly parametres: ParametresDeFiltre;
    readonly requeteAttendue: Readonly<Record<string, unknown>>;
  };
  readonly lister: (stubs: LegacyUseCaseStubs) => UseCaseSimule;
  readonly creer: (stubs: LegacyUseCaseStubs) => UseCaseSimule;
}

type ParametresDeFiltre = Readonly<Record<string, string | number>>;

function filtreTransmisTelQuel(
  parametres: ParametresDeFiltre,
): ContexteLegacy['filtre'] {
  return { parametres, requeteAttendue: parametres };
}

const FILTRE_DES_REDIRECTIONS: ParametresDeFiltre = {
  page: 1,
  limit: 50,
  sortBy: 'clicks',
  order: 'DESC',
  enabled: 'false',
};

const CONTEXTES_LEGACY: readonly ContexteLegacy[] = [
  {
    route: 'services',
    controleur: ServicesController,
    listQueryDto: ServiceListQueryDto,
    requestDto: ServiceRequestDto,
    payload: LEGACY_SERVICE_PAYLOAD,
    entite: { id: 'service-1', ...LEGACY_SERVICE_PAYLOAD },
    requeteParDefaut: {
      page: 1,
      limit: 20,
      sortBy: 'order',
      status: undefined,
      order: 'ASC',
    },
    filtre: filtreTransmisTelQuel({
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      order: 'DESC',
      status: 'DRAFT',
    }),
    lister: (stubs) => stubs.listServicesUseCase,
    creer: (stubs) => stubs.createServicesUseCase,
  },
  {
    route: 'projects',
    controleur: ProjectsController,
    listQueryDto: ProjectListQueryDto,
    requestDto: ProjectRequestDto,
    payload: LEGACY_PROJECT_PAYLOAD,
    entite: { id: 'project-1', ...LEGACY_PROJECT_PAYLOAD },
    requeteParDefaut: {
      page: 1,
      limit: 20,
      sortBy: 'order',
      type: undefined,
      status: undefined,
      order: 'ASC',
    },
    filtre: filtreTransmisTelQuel({
      page: 3,
      limit: 10,
      sortBy: 'type',
      order: 'ASC',
      type: 'SIDE',
      status: 'PUBLISHED',
    }),
    lister: (stubs) => stubs.listProjectsUseCase,
    creer: (stubs) => stubs.createProjectsUseCase,
  },
  {
    route: 'courses',
    controleur: CoursesController,
    listQueryDto: CourseListQueryDto,
    requestDto: CourseRequestDto,
    payload: LEGACY_COURSE_PAYLOAD,
    entite: { id: 'course-1', ...LEGACY_COURSE_PAYLOAD },
    requeteParDefaut: {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'DESC',
    },
    lister: (stubs) => stubs.listCoursesUseCase,
    creer: (stubs) => stubs.createCoursesUseCase,
  },
  {
    route: 'redirects',
    controleur: RedirectsController,
    listQueryDto: RedirectListQueryDto,
    requestDto: RedirectRequestDto,
    payload: LEGACY_REDIRECT_PAYLOAD,
    entite: { id: 'redirect-1', ...LEGACY_REDIRECT_PAYLOAD },
    requeteParDefaut: {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      enabled: undefined,
      order: 'DESC',
    },
    filtre: {
      parametres: FILTRE_DES_REDIRECTIONS,
      requeteAttendue: { ...FILTRE_DES_REDIRECTIONS, enabled: false },
    },
    lister: (stubs) => stubs.listRedirectsUseCase,
    creer: (stubs) => stubs.createRedirectsUseCase,
  },
];

type CasLegacy = readonly [route: string, contexte: ContexteLegacy];

const enCasParRoute = (contextes: readonly ContexteLegacy[]): CasLegacy[] =>
  contextes.map((contexte) => [contexte.route, contexte]);

export const CAS_LEGACY = enCasParRoute(CONTEXTES_LEGACY);

export const CAS_LEGACY_FILTRABLES = enCasParRoute(
  CONTEXTES_LEGACY.filter((contexte) => contexte.filtre !== undefined),
);

export function attendreListeParDefaut(
  contexte: ContexteLegacy,
  stubs: LegacyUseCaseStubs,
): void {
  expect(contexte.lister(stubs).execute).toHaveBeenCalledWith(
    contexte.requeteParDefaut,
  );
}

export function attendreFiltreTransmis(
  contexte: ContexteLegacy,
  stubs: LegacyUseCaseStubs,
): void {
  expect(contexte.lister(stubs).execute).toHaveBeenCalledWith(
    contexte.filtre?.requeteAttendue,
  );
}

export function attendreCreationTransmise(
  contexte: ContexteLegacy,
  stubs: LegacyUseCaseStubs,
  resultat: unknown,
): void {
  expect(contexte.creer(stubs).execute).toHaveBeenCalledWith(contexte.payload);
  expect(resultat).toEqual(contexte.entite);
}

export function parametresDeListeParDefaut(
  contexte: ContexteLegacy,
): Record<string, string> {
  const { page, limit, sortBy, order } = contexte.requeteParDefaut;
  return {
    page: String(page),
    limit: String(limit),
    sortBy: String(sortBy),
    order: String(order),
  };
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
  for (const contexte of CONTEXTES_LEGACY) {
    contexte
      .lister(stubs)
      .execute.mockResolvedValue(legacyListResult(contexte.entite));
    contexte.creer(stubs).execute.mockResolvedValue(contexte.entite);
  }
}
