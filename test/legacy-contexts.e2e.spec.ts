import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateCoursesUseCase } from '../src/modules/courses/application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../src/modules/courses/application/ListCourses.useCase';
import { CoursesController } from '../src/modules/courses/interfaces/Courses.controller';
import { CourseListQueryDto } from '../src/modules/courses/interfaces/dto/course-list.query.dto';
import { CourseRequestDto } from '../src/modules/courses/interfaces/dto/course.request.dto';
import { CreateProjectsUseCase } from '../src/modules/projects/application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../src/modules/projects/application/ListProjects.useCase';
import { ProjectsController } from '../src/modules/projects/interfaces/Projects.controller';
import { ProjectListQueryDto } from '../src/modules/projects/interfaces/dto/project-list.query.dto';
import { ProjectRequestDto } from '../src/modules/projects/interfaces/dto/project.request.dto';
import { CreateRedirectsUseCase } from '../src/modules/redirects/application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../src/modules/redirects/application/ListRedirects.useCase';
import { RedirectsController } from '../src/modules/redirects/interfaces/Redirects.controller';
import { RedirectListQueryDto } from '../src/modules/redirects/interfaces/dto/redirect-list.query.dto';
import { RedirectRequestDto } from '../src/modules/redirects/interfaces/dto/redirect.request.dto';
import { CreateServicesUseCase } from '../src/modules/services/application/CreateServices.useCase';
import { ListServicesUseCase } from '../src/modules/services/application/ListServices.useCase';
import { ServicesController } from '../src/modules/services/interfaces/Services.controller';
import { ServiceListQueryDto } from '../src/modules/services/interfaces/dto/service-list.query.dto';
import { ServiceRequestDto } from '../src/modules/services/interfaces/dto/service.request.dto';

describe('Legacy contexts connectivity (e2e transportless)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const createServicesUseCase = { execute: jest.fn() };
  const listServicesUseCase = { execute: jest.fn() };
  const createProjectsUseCase = { execute: jest.fn() };
  const listProjectsUseCase = { execute: jest.fn() };
  const createCoursesUseCase = { execute: jest.fn() };
  const listCoursesUseCase = { execute: jest.fn() };
  const createRedirectsUseCase = { execute: jest.fn() };
  const listRedirectsUseCase = { execute: jest.fn() };

  let servicesController: ServicesController;
  let projectsController: ProjectsController;
  let coursesController: CoursesController;
  let redirectsController: RedirectsController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ServicesController,
        ProjectsController,
        CoursesController,
        RedirectsController,
      ],
      providers: [
        { provide: ListServicesUseCase, useValue: listServicesUseCase },
        { provide: CreateServicesUseCase, useValue: createServicesUseCase },
        { provide: ListProjectsUseCase, useValue: listProjectsUseCase },
        { provide: CreateProjectsUseCase, useValue: createProjectsUseCase },
        { provide: ListCoursesUseCase, useValue: listCoursesUseCase },
        { provide: CreateCoursesUseCase, useValue: createCoursesUseCase },
        { provide: ListRedirectsUseCase, useValue: listRedirectsUseCase },
        { provide: CreateRedirectsUseCase, useValue: createRedirectsUseCase },
      ],
    }).compile();

    servicesController = moduleRef.get(ServicesController);
    projectsController = moduleRef.get(ProjectsController);
    coursesController = moduleRef.get(CoursesController);
    redirectsController = moduleRef.get(RedirectsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    listServicesUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'service-1',
          slug: 'technical-seo',
          name: 'Technical SEO',
          icon: '/icons/seo.svg',
          status: 'PUBLISHED',
          order: 2,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    createServicesUseCase.execute.mockResolvedValue({
      id: 'service-1',
      slug: 'technical-seo',
      name: 'Technical SEO',
      icon: '/icons/seo.svg',
      status: 'PUBLISHED',
      order: 2,
    });
    listProjectsUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'project-1',
          slug: 'portfolio-site',
          type: 'SIDE',
          repoUrl: 'https://github.com/acme/portfolio',
          liveUrl: 'https://example.com',
          coverImage: '/images/portfolio.webp',
          gallery: ['/images/portfolio-1.webp'],
          stack: ['nestjs', 'postgres'],
          status: 'PUBLISHED',
          order: 1,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    createProjectsUseCase.execute.mockResolvedValue({
      id: 'project-1',
      slug: 'portfolio-site',
      type: 'SIDE',
      repoUrl: 'https://github.com/acme/portfolio',
      liveUrl: 'https://example.com',
      coverImage: '/images/portfolio.webp',
      gallery: ['/images/portfolio-1.webp'],
      stack: ['nestjs', 'postgres'],
      status: 'PUBLISHED',
      order: 1,
    });
    listCoursesUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'course-1',
          slug: 'ai-course',
          title: 'AI Course',
          summary: 'A premium course for practical AI delivery.',
          coverImage: '/images/ai-course.webp',
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    createCoursesUseCase.execute.mockResolvedValue({
      id: 'course-1',
      slug: 'ai-course',
      title: 'AI Course',
      summary: 'A premium course for practical AI delivery.',
      coverImage: '/images/ai-course.webp',
    });
    listRedirectsUseCase.execute.mockResolvedValue({
      items: [
        {
          id: 'redirect-1',
          slug: 'promo-offer',
          targetUrl: 'https://example.com/promo',
          enabled: true,
          clicks: 0,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    createRedirectsUseCase.execute.mockResolvedValue({
      id: 'redirect-1',
      slug: 'promo-offer',
      targetUrl: 'https://example.com/promo',
      enabled: true,
      clicks: 0,
    });
  });

  async function validateBody<T>(
    payload: unknown,
    metatype: new () => T,
  ): Promise<T> {
    return (await validationPipe.transform(payload, {
      type: 'body',
      metatype,
      data: '',
    })) as T;
  }

  async function validateQuery<T>(
    payload: unknown,
    metatype: new () => T,
  ): Promise<T> {
    return (await validationPipe.transform(payload, {
      type: 'query',
      metatype,
      data: '',
    })) as T;
  }

  it('exposes paginated GET responses on legacy controllers', async () => {
    const servicesQuery = await validateQuery({}, ServiceListQueryDto);
    const projectsQuery = await validateQuery({}, ProjectListQueryDto);
    const coursesQuery = await validateQuery({}, CourseListQueryDto);
    const redirectsQuery = await validateQuery({}, RedirectListQueryDto);

    await expect(servicesController.findAll(servicesQuery)).resolves.toEqual({
      items: [
        {
          id: 'service-1',
          slug: 'technical-seo',
          name: 'Technical SEO',
          icon: '/icons/seo.svg',
          status: 'PUBLISHED',
          order: 2,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(projectsController.findAll(projectsQuery)).resolves.toEqual({
      items: [
        {
          id: 'project-1',
          slug: 'portfolio-site',
          type: 'SIDE',
          repoUrl: 'https://github.com/acme/portfolio',
          liveUrl: 'https://example.com',
          coverImage: '/images/portfolio.webp',
          gallery: ['/images/portfolio-1.webp'],
          stack: ['nestjs', 'postgres'],
          status: 'PUBLISHED',
          order: 1,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(coursesController.findAll(coursesQuery)).resolves.toEqual({
      items: [
        {
          id: 'course-1',
          slug: 'ai-course',
          title: 'AI Course',
          summary: 'A premium course for practical AI delivery.',
          coverImage: '/images/ai-course.webp',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(redirectsController.findAll(redirectsQuery)).resolves.toEqual({
      items: [
        {
          id: 'redirect-1',
          slug: 'promo-offer',
          targetUrl: 'https://example.com/promo',
          enabled: true,
          clicks: 0,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    expect(listServicesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'order',
      status: undefined,
      order: 'ASC',
    });
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'order',
      type: undefined,
      status: undefined,
      order: 'ASC',
    });
    expect(listCoursesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'DESC',
    });
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      enabled: undefined,
      order: 'DESC',
    });
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

    expect(listServicesUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      status: 'DRAFT',
      order: 'DESC',
    });
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      page: 3,
      limit: 10,
      sortBy: 'type',
      type: 'SIDE',
      status: 'PUBLISHED',
      order: 'ASC',
    });
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      sortBy: 'clicks',
      enabled: false,
      order: 'DESC',
    });
  });

  it('connects POST services to use case with validated command payload', async () => {
    const payload = await validateBody(
      {
        slug: 'technical-seo',
        name: 'Technical SEO',
        icon: '/icons/seo.svg',
        status: 'PUBLISHED',
        order: 2,
      },
      ServiceRequestDto,
    );

    const result = await servicesController.create(payload);

    expect(createServicesUseCase.execute).toHaveBeenCalledWith({
      slug: 'technical-seo',
      name: 'Technical SEO',
      icon: '/icons/seo.svg',
      status: 'PUBLISHED',
      order: 2,
    });
    expect(result).toEqual({
      id: 'service-1',
      slug: 'technical-seo',
      name: 'Technical SEO',
      icon: '/icons/seo.svg',
      status: 'PUBLISHED',
      order: 2,
    });
  });

  it('connects POST projects to use case with validated command payload', async () => {
    const payload = await validateBody(
      {
        slug: 'portfolio-site',
        type: 'SIDE',
        repoUrl: 'https://github.com/acme/portfolio',
        liveUrl: 'https://example.com',
        coverImage: '/images/portfolio.webp',
        gallery: ['/images/portfolio-1.webp'],
        stack: ['nestjs', 'postgres'],
        status: 'PUBLISHED',
        order: 1,
      },
      ProjectRequestDto,
    );

    const result = await projectsController.create(payload);

    expect(createProjectsUseCase.execute).toHaveBeenCalledWith({
      slug: 'portfolio-site',
      type: 'SIDE',
      repoUrl: 'https://github.com/acme/portfolio',
      liveUrl: 'https://example.com',
      coverImage: '/images/portfolio.webp',
      gallery: ['/images/portfolio-1.webp'],
      stack: ['nestjs', 'postgres'],
      status: 'PUBLISHED',
      order: 1,
    });
    expect(result).toEqual({
      id: 'project-1',
      slug: 'portfolio-site',
      type: 'SIDE',
      repoUrl: 'https://github.com/acme/portfolio',
      liveUrl: 'https://example.com',
      coverImage: '/images/portfolio.webp',
      gallery: ['/images/portfolio-1.webp'],
      stack: ['nestjs', 'postgres'],
      status: 'PUBLISHED',
      order: 1,
    });
  });

  it('connects POST courses to use case with validated command payload', async () => {
    const payload = await validateBody(
      {
        slug: 'ai-course',
        title: 'AI Course',
        summary: 'A premium course for practical AI delivery.',
        coverImage: '/images/ai-course.webp',
      },
      CourseRequestDto,
    );

    const result = await coursesController.create(payload);

    expect(createCoursesUseCase.execute).toHaveBeenCalledWith({
      slug: 'ai-course',
      title: 'AI Course',
      summary: 'A premium course for practical AI delivery.',
      coverImage: '/images/ai-course.webp',
    });
    expect(result).toEqual({
      id: 'course-1',
      slug: 'ai-course',
      title: 'AI Course',
      summary: 'A premium course for practical AI delivery.',
      coverImage: '/images/ai-course.webp',
    });
  });

  it('connects POST redirects to use case with validated command payload', async () => {
    const payload = await validateBody(
      {
        slug: 'promo-offer',
        targetUrl: 'https://example.com/promo',
        enabled: true,
        clicks: 0,
      },
      RedirectRequestDto,
    );

    const result = await redirectsController.create(payload);

    expect(createRedirectsUseCase.execute).toHaveBeenCalledWith({
      slug: 'promo-offer',
      targetUrl: 'https://example.com/promo',
      enabled: true,
      clicks: 0,
    });
    expect(result).toEqual({
      id: 'redirect-1',
      slug: 'promo-offer',
      targetUrl: 'https://example.com/promo',
      enabled: true,
      clicks: 0,
    });
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
      validateQuery(
        {
          sortBy: 'invalid',
        },
        ServiceListQueryDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid legacy filter values', async () => {
    await expect(
      validateQuery(
        {
          status: 'INVALID',
        },
        ServiceListQueryDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      validateQuery(
        {
          type: 'INVALID',
        },
        ProjectListQueryDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      validateQuery(
        {
          enabled: 'INVALID',
        },
        RedirectListQueryDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
