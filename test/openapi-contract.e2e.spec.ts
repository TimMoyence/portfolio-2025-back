import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CreateCoursesUseCase } from '../src/modules/courses/application/CreateCourses.useCase';
import { ListCoursesUseCase } from '../src/modules/courses/application/ListCourses.useCase';
import { CoursesController } from '../src/modules/courses/interfaces/Courses.controller';
import { CreateProjectsUseCase } from '../src/modules/projects/application/CreateProjects.useCase';
import { ListProjectsUseCase } from '../src/modules/projects/application/ListProjects.useCase';
import { ProjectsController } from '../src/modules/projects/interfaces/Projects.controller';
import { CreateRedirectsUseCase } from '../src/modules/redirects/application/CreateRedirects.useCase';
import { ListRedirectsUseCase } from '../src/modules/redirects/application/ListRedirects.useCase';
import { RedirectsController } from '../src/modules/redirects/interfaces/Redirects.controller';
import { CreateServicesUseCase } from '../src/modules/services/application/CreateServices.useCase';
import { ListServicesUseCase } from '../src/modules/services/application/ListServices.useCase';
import { ServicesController } from '../src/modules/services/interfaces/Services.controller';

describe('OpenAPI legacy contract (phase 11)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ServicesController,
        ProjectsController,
        CoursesController,
        RedirectsController,
      ],
      providers: [
        { provide: ListServicesUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateServicesUseCase, useValue: { execute: jest.fn() } },
        { provide: ListProjectsUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateProjectsUseCase, useValue: { execute: jest.fn() } },
        { provide: ListCoursesUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateCoursesUseCase, useValue: { execute: jest.fn() } },
        { provide: ListRedirectsUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateRedirectsUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps legacy path contracts stable', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0').build(),
    );

    const pathBySuffix = (suffix: string) => {
      const path = Object.keys(document.paths).find((candidate) =>
        candidate.endsWith(suffix),
      );
      if (!path) {
        throw new Error(`Missing OpenAPI path with suffix ${suffix}`);
      }
      return document.paths[path];
    };

    expect({
      services: pathBySuffix('/services'),
      projects: pathBySuffix('/projects'),
      courses: pathBySuffix('/courses'),
      redirects: pathBySuffix('/redirects'),
    }).toMatchSnapshot();
  });

  it('keeps legacy DTO schemas stable', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Contract Test').setVersion('1.0').build(),
    );
    const schemas = document.components?.schemas ?? {};

    expect({
      ServiceResponseDto: schemas.ServiceResponseDto,
      ServiceListResponseDto: schemas.ServiceListResponseDto,
      ServiceRequestDto: schemas.ServiceRequestDto,
      ProjectRequestDto: schemas.ProjectRequestDto,
      ProjectResponseDto: schemas.ProjectResponseDto,
      ProjectListResponseDto: schemas.ProjectListResponseDto,
      CourseRequestDto: schemas.CourseRequestDto,
      CourseResponseDto: schemas.CourseResponseDto,
      CourseListResponseDto: schemas.CourseListResponseDto,
      RedirectRequestDto: schemas.RedirectRequestDto,
      RedirectResponseDto: schemas.RedirectResponseDto,
      RedirectListResponseDto: schemas.RedirectListResponseDto,
      PaginationMetaResponseDto: schemas.PaginationMetaResponseDto,
    }).toMatchSnapshot();
  });
});
