import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CoursesController } from '../src/modules/courses/interfaces/Courses.controller';
import { CourseListQueryDto } from '../src/modules/courses/interfaces/dto/course-list.query.dto';
import { CourseRequestDto } from '../src/modules/courses/interfaces/dto/course.request.dto';
import { ProjectsController } from '../src/modules/projects/interfaces/Projects.controller';
import { ProjectListQueryDto } from '../src/modules/projects/interfaces/dto/project-list.query.dto';
import { ProjectRequestDto } from '../src/modules/projects/interfaces/dto/project.request.dto';
import { RedirectsController } from '../src/modules/redirects/interfaces/Redirects.controller';
import { RedirectListQueryDto } from '../src/modules/redirects/interfaces/dto/redirect-list.query.dto';
import { RedirectRequestDto } from '../src/modules/redirects/interfaces/dto/redirect.request.dto';
import { ServicesController } from '../src/modules/services/interfaces/Services.controller';
import { ServiceListQueryDto } from '../src/modules/services/interfaces/dto/service-list.query.dto';
import { ServiceRequestDto } from '../src/modules/services/interfaces/dto/service.request.dto';
import {
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  LEGACY_COURSE,
  LEGACY_COURSES_DEFAULT_QUERY,
  LEGACY_COURSE_PAYLOAD,
  LEGACY_PROJECT,
  LEGACY_PROJECTS_DEFAULT_QUERY,
  LEGACY_PROJECTS_FILTERED_QUERY,
  LEGACY_PROJECT_PAYLOAD,
  LEGACY_REDIRECT,
  LEGACY_REDIRECTS_DEFAULT_QUERY,
  LEGACY_REDIRECTS_FILTERED_QUERY,
  LEGACY_REDIRECT_PAYLOAD,
  LEGACY_SERVICE,
  LEGACY_SERVICES_DEFAULT_QUERY,
  LEGACY_SERVICES_FILTERED_QUERY,
  LEGACY_SERVICE_PAYLOAD,
  legacyControllerProviders,
  legacyListBody,
  primeLegacyUseCaseStubs,
} from './factories/legacy-contract.factory';
import { validateBody, validateQuery } from './helpers/validation-pipe';

describe('Legacy contexts connectivity (e2e transportless)', () => {
  const stubs = createLegacyUseCaseStubs();
  const {
    createServicesUseCase,
    listServicesUseCase,
    createProjectsUseCase,
    listProjectsUseCase,
    createCoursesUseCase,
    listCoursesUseCase,
    createRedirectsUseCase,
    listRedirectsUseCase,
  } = stubs;

  let servicesController: ServicesController;
  let projectsController: ProjectsController;
  let coursesController: CoursesController;
  let redirectsController: RedirectsController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: LEGACY_CONTROLLERS,
      providers: legacyControllerProviders(stubs),
    }).compile();

    servicesController = moduleRef.get(ServicesController);
    projectsController = moduleRef.get(ProjectsController);
    coursesController = moduleRef.get(CoursesController);
    redirectsController = moduleRef.get(RedirectsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    primeLegacyUseCaseStubs(stubs);
  });

  it('exposes paginated GET responses on legacy controllers', async () => {
    const servicesQuery = await validateQuery({}, ServiceListQueryDto);
    const projectsQuery = await validateQuery({}, ProjectListQueryDto);
    const coursesQuery = await validateQuery({}, CourseListQueryDto);
    const redirectsQuery = await validateQuery({}, RedirectListQueryDto);

    await expect(servicesController.findAll(servicesQuery)).resolves.toEqual(
      legacyListBody(LEGACY_SERVICE),
    );
    await expect(projectsController.findAll(projectsQuery)).resolves.toEqual(
      legacyListBody(LEGACY_PROJECT),
    );
    await expect(coursesController.findAll(coursesQuery)).resolves.toEqual(
      legacyListBody(LEGACY_COURSE),
    );
    await expect(redirectsController.findAll(redirectsQuery)).resolves.toEqual(
      legacyListBody(LEGACY_REDIRECT),
    );

    expect(listServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICES_DEFAULT_QUERY,
    );
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_PROJECTS_DEFAULT_QUERY,
    );
    expect(listCoursesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_COURSES_DEFAULT_QUERY,
    );
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_REDIRECTS_DEFAULT_QUERY,
    );
  });

  it('forwards optional legacy GET filters to list use cases', async () => {
    const servicesQuery = await validateQuery(
      {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        order: 'DESC',
        status: 'DRAFT',
      },
      ServiceListQueryDto,
    );

    const projectsQuery = await validateQuery(
      {
        page: 3,
        limit: 10,
        sortBy: 'type',
        order: 'ASC',
        type: 'SIDE',
        status: 'PUBLISHED',
      },
      ProjectListQueryDto,
    );

    const redirectsQuery = await validateQuery(
      {
        page: 1,
        limit: 50,
        sortBy: 'clicks',
        order: 'DESC',
        enabled: 'false',
      },
      RedirectListQueryDto,
    );

    await servicesController.findAll(servicesQuery);
    await projectsController.findAll(projectsQuery);
    await redirectsController.findAll(redirectsQuery);

    expect(listServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICES_FILTERED_QUERY,
    );
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_PROJECTS_FILTERED_QUERY,
    );
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_REDIRECTS_FILTERED_QUERY,
    );
  });

  it('connects POST services to use case with validated command payload', async () => {
    const payload = await validateBody(
      LEGACY_SERVICE_PAYLOAD,
      ServiceRequestDto,
    );

    const result = await servicesController.create(payload);

    expect(createServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICE_PAYLOAD,
    );
    expect(result).toEqual(LEGACY_SERVICE);
  });

  it('connects POST projects to use case with validated command payload', async () => {
    const payload = await validateBody(
      LEGACY_PROJECT_PAYLOAD,
      ProjectRequestDto,
    );

    const result = await projectsController.create(payload);

    expect(createProjectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_PROJECT_PAYLOAD,
    );
    expect(result).toEqual(LEGACY_PROJECT);
  });

  it('connects POST courses to use case with validated command payload', async () => {
    const payload = await validateBody(LEGACY_COURSE_PAYLOAD, CourseRequestDto);

    const result = await coursesController.create(payload);

    expect(createCoursesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_COURSE_PAYLOAD,
    );
    expect(result).toEqual(LEGACY_COURSE);
  });

  it('connects POST redirects to use case with validated command payload', async () => {
    const payload = await validateBody(
      LEGACY_REDIRECT_PAYLOAD,
      RedirectRequestDto,
    );

    const result = await redirectsController.create(payload);

    expect(createRedirectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_REDIRECT_PAYLOAD,
    );
    expect(result).toEqual(LEGACY_REDIRECT);
  });

  it('rejects non-whitelisted fields on legacy DTOs', async () => {
    await expect(
      validateBody(
        {
          slug: 'technical-seo',
          name: 'Technical SEO',
          injected: 'forbidden',
        },
        ServiceRequestDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid sort field on legacy list query', async () => {
    await expect(
      validateQuery({ sortBy: 'invalid' }, ServiceListQueryDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid legacy filter values', async () => {
    await expect(
      validateQuery({ status: 'INVALID' }, ServiceListQueryDto),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      validateQuery({ type: 'INVALID' }, ProjectListQueryDto),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      validateQuery({ enabled: 'INVALID' }, RedirectListQueryDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
