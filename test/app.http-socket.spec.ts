import {
  BadRequestException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import request from 'supertest';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { CreateAuditRequestsUseCase } from '../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../src/modules/audit-requests/application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../src/modules/audit-requests/application/StreamAuditEvents.useCase';
import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { CreateContactsUseCase } from '../src/modules/contacts/application/CreateContacts.useCase';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { CreateCookieConsentsUseCase } from '../src/modules/cookie-consents/application/CreateCookieConsents.useCase';
import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { SetPasswordUseCase } from '../src/modules/users/application/SetPassword.useCase';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
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

describe('API coherence and connectivity (e2e http socket)', () => {
  let app: INestApplication;

  const createContactsUseCase = { execute: jest.fn() };
  const createCookieConsentsUseCase = { execute: jest.fn() };
  const createAuditRequestsUseCase = { execute: jest.fn() };
  const getAuditSummaryUseCase = { execute: jest.fn() };
  const streamAuditEventsUseCase = { execute: jest.fn() };
  const authenticateUserUseCase = { execute: jest.fn() };
  const authenticateGoogleUserUseCase = { execute: jest.fn() };
  const createUsersUseCase = { execute: jest.fn() };
  const changePasswordUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const setPasswordUseCase = { execute: jest.fn() };
  const createServicesUseCase = { execute: jest.fn() };
  const listServicesUseCase = { execute: jest.fn() };
  const createProjectsUseCase = { execute: jest.fn() };
  const listProjectsUseCase = { execute: jest.fn() };
  const createCoursesUseCase = { execute: jest.fn() };
  const listCoursesUseCase = { execute: jest.fn() };
  const createRedirectsUseCase = { execute: jest.fn() };
  const listRedirectsUseCase = { execute: jest.fn() };
  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ContactsController,
        CookieConsentsController,
        AuditsController,
        AuthController,
        ServicesController,
        ProjectsController,
        CoursesController,
        RedirectsController,
      ],
      providers: [
        { provide: CreateContactsUseCase, useValue: createContactsUseCase },
        {
          provide: CreateCookieConsentsUseCase,
          useValue: createCookieConsentsUseCase,
        },
        {
          provide: CreateAuditRequestsUseCase,
          useValue: createAuditRequestsUseCase,
        },
        { provide: GetAuditSummaryUseCase, useValue: getAuditSummaryUseCase },
        {
          provide: StreamAuditEventsUseCase,
          useValue: streamAuditEventsUseCase,
        },
        {
          provide: AuthenticateUserUseCase,
          useValue: authenticateUserUseCase,
        },
        {
          provide: AuthenticateGoogleUserUseCase,
          useValue: authenticateGoogleUserUseCase,
        },
        { provide: CreateUsersUseCase, useValue: createUsersUseCase },
        { provide: ChangePasswordUseCase, useValue: changePasswordUseCase },
        {
          provide: RequestPasswordResetUseCase,
          useValue: requestPasswordResetUseCase,
        },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: SetPasswordUseCase, useValue: setPasswordUseCase },
        { provide: USERS_REPOSITORY, useValue: { findById: jest.fn() } },
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

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    createContactsUseCase.execute.mockResolvedValue({
      message: 'Contact request created successfully.',
    });

    createCookieConsentsUseCase.execute.mockResolvedValue({
      message: 'Cookie consent recorded successfully.',
    });

    createAuditRequestsUseCase.execute.mockResolvedValue({
      message: 'Audit request created successfully.',
      auditId: 'audit-1',
      status: 'PENDING',
    });

    getAuditSummaryUseCase.execute.mockResolvedValue({
      auditId: 'audit-1',
      ready: true,
      status: 'COMPLETED',
      progress: 100,
      summaryText: 'Great foundation with clear quick wins.',
      keyChecks: { securityHeaders: true },
      quickWins: ['Improve title tags'],
      pillarScores: { seo: 80 },
    });

    streamAuditEventsUseCase.execute.mockReturnValue(
      of({
        type: 'progress',
        data: {
          auditId: 'audit-1',
          status: 'RUNNING',
          progress: 30,
          step: 'crawl',
          done: false,
          updatedAt: new Date().toISOString(),
        },
      }),
    );

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

    requestPasswordResetUseCase.execute.mockResolvedValue({
      message:
        'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
    });
    resetPasswordUseCase.execute.mockResolvedValue({
      message: 'Mot de passe reinitialise avec succes.',
    });
    setPasswordUseCase.execute.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
      roles: ['weather'],
      passwordHash: 'new-hash',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedOrCreatedBy: 'self-service',
      googleId: 'google-id',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/contacts validates payload and returns contract response', async () => {
    const response = await request(getHttpServer())
      .post('/api/contacts')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        message: 'Hello, I need help with a premium implementation.',
        subject: 'Need support',
        role: 'CTO',
        terms: true,
      })
      .expect(201);

    expect(response.body).toEqual({
      message: 'Contact request created successfully.',
      httpCode: 201,
    });
  });

  it('POST /api/contacts forbids non-whitelisted fields', async () => {
    const response = await request(getHttpServer())
      .post('/api/contacts')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        message: 'Hello, I need help with a premium implementation.',
        subject: 'Need support',
        role: 'CTO',
        terms: true,
        injected: 'forbidden',
      })
      .expect(400);

    const detail = response.body.detail as string | string[];
    const messages = Array.isArray(detail) ? detail : [String(detail)];
    expect(
      messages.some((m) => m.includes('property injected should not exist')),
    ).toBe(true);
  });

  it('POST /api/audits resolves locale from referer when not provided', async () => {
    const response = await request(getHttpServer())
      .post('/api/audits')
      .set('referer', 'https://example.com/en/contact')
      .send({
        websiteName: 'Example Studio',
        contactMethod: 'EMAIL',
        contactValue: 'hello@example.com',
      })
      .expect(201);

    expect(response.body).toEqual({
      message: 'Audit request created successfully.',
      httpCode: 201,
      auditId: 'audit-1',
      status: 'PENDING',
    });
  });

  it('GET /api/audits/:id/summary returns summary snapshot', async () => {
    const response = await request(getHttpServer())
      .get('/api/audits/00000000-0000-4000-a000-000000000001/summary')
      .expect(200);

    expect(response.body).toEqual({
      auditId: 'audit-1',
      ready: true,
      status: 'COMPLETED',
      progress: 100,
      summaryText: 'Great foundation with clear quick wins.',
      keyChecks: { securityHeaders: true },
      quickWins: ['Improve title tags'],
      pillarScores: { seo: 80 },
    });
  });

  it('GET /api/audits/:id/stream exposes SSE event stream', async () => {
    const response = await request(getHttpServer())
      .get('/api/audits/00000000-0000-4000-a000-000000000001/stream')
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);

    expect(response.text).toContain('event: progress');
    expect(response.text).toContain('"auditId":"audit-1"');
  });

  it('POST /api/auth/login returns 401 for invalid credentials', async () => {
    authenticateUserUseCase.execute.mockRejectedValueOnce(
      new UnauthorizedException('Invalid credentials'),
    );

    await request(getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'WrongPassword1!',
      })
      .expect(401);
  });

  it('POST /api/auth/forgot-password returns generic success message', async () => {
    const response = await request(getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'john@example.com' })
      .expect(200);

    expect(response.body).toEqual({
      message:
        'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
    });
  });

  it('POST /api/auth/reset-password returns 400 when token is invalid', async () => {
    resetPasswordUseCase.execute.mockRejectedValueOnce(
      new BadRequestException('Invalid token'),
    );

    await request(getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token:
          '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
        newPassword: 'NewPassword123!',
      })
      .expect(400);
  });

  it('GET /api/services exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/services?page=1&limit=20&sortBy=order&order=ASC')
      .expect(200);

    expect(response.body).toEqual({
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
    expect(listServicesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'order',
      status: undefined,
      order: 'ASC',
    });
  });

  it('GET /api/projects exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/projects?page=1&limit=20&sortBy=order&order=ASC')
      .expect(200);

    expect(response.body).toEqual({
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
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'order',
      type: undefined,
      status: undefined,
      order: 'ASC',
    });
  });

  it('GET /api/courses exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/courses?page=1&limit=20&sortBy=createdAt&order=DESC')
      .expect(200);

    expect(response.body).toEqual({
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
    expect(listCoursesUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'DESC',
    });
  });

  it('GET /api/redirects exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/redirects?page=1&limit=20&sortBy=createdAt&order=DESC')
      .expect(200);

    expect(response.body).toEqual({
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
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      enabled: undefined,
      order: 'DESC',
    });
  });

  it('GET legacy endpoints forward optional list filters', async () => {
    await request(getHttpServer())
      .get(
        '/api/services?page=2&limit=5&sortBy=createdAt&order=DESC&status=DRAFT',
      )
      .expect(200);
    expect(listServicesUseCase.execute).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      status: 'DRAFT',
      order: 'DESC',
    });

    await request(getHttpServer())
      .get(
        '/api/projects?page=3&limit=10&sortBy=type&order=ASC&type=SIDE&status=PUBLISHED',
      )
      .expect(200);
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith({
      page: 3,
      limit: 10,
      sortBy: 'type',
      type: 'SIDE',
      status: 'PUBLISHED',
      order: 'ASC',
    });

    await request(getHttpServer())
      .get(
        '/api/redirects?page=1&limit=50&sortBy=clicks&order=DESC&enabled=false',
      )
      .expect(200);
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      sortBy: 'clicks',
      enabled: false,
      order: 'DESC',
    });
  });

  it('POST /api/services forwards payload to legacy services use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/services')
      .send({
        slug: 'technical-seo',
        name: 'Technical SEO',
        icon: '/icons/seo.svg',
        status: 'PUBLISHED',
        order: 2,
      })
      .expect(201);

    expect(createServicesUseCase.execute).toHaveBeenCalledWith({
      slug: 'technical-seo',
      name: 'Technical SEO',
      icon: '/icons/seo.svg',
      status: 'PUBLISHED',
      order: 2,
    });
    expect(response.body).toEqual({
      id: 'service-1',
      slug: 'technical-seo',
      name: 'Technical SEO',
      icon: '/icons/seo.svg',
      status: 'PUBLISHED',
      order: 2,
    });
  });

  it('POST /api/projects forwards payload to legacy projects use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/projects')
      .send({
        slug: 'portfolio-site',
        type: 'SIDE',
        repoUrl: 'https://github.com/acme/portfolio',
        liveUrl: 'https://example.com',
        coverImage: '/images/portfolio.webp',
        gallery: ['/images/portfolio-1.webp'],
        stack: ['nestjs', 'postgres'],
        status: 'PUBLISHED',
        order: 1,
      })
      .expect(201);

    expect(response.body).toEqual({
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

  it('POST /api/courses forwards payload to legacy courses use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/courses')
      .send({
        slug: 'ai-course',
        title: 'AI Course',
        summary: 'A premium course for practical AI delivery.',
        coverImage: '/images/ai-course.webp',
      })
      .expect(201);

    expect(response.body).toEqual({
      id: 'course-1',
      slug: 'ai-course',
      title: 'AI Course',
      summary: 'A premium course for practical AI delivery.',
      coverImage: '/images/ai-course.webp',
    });
  });

  it('POST /api/redirects forwards payload to legacy redirects use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/redirects')
      .send({
        slug: 'promo-offer',
        targetUrl: 'https://example.com/promo',
        enabled: true,
        clicks: 0,
      })
      .expect(201);

    expect(response.body).toEqual({
      id: 'redirect-1',
      slug: 'promo-offer',
      targetUrl: 'https://example.com/promo',
      enabled: true,
      clicks: 0,
    });
  });

  it('POST /api/services rejects non-whitelisted fields', async () => {
    const response = await request(getHttpServer())
      .post('/api/services')
      .send({
        slug: 'technical-seo',
        name: 'Technical SEO',
        injected: 'forbidden',
      })
      .expect(400);

    const detail = response.body.detail as string | string[];
    const messages = Array.isArray(detail) ? detail : [String(detail)];
    expect(
      messages.some((m) => m.includes('property injected should not exist')),
    ).toBe(true);
  });

  it('GET /api/services rejects invalid sort query', async () => {
    const response = await request(getHttpServer())
      .get('/api/services?sortBy=invalid')
      .expect(400);

    const detail = response.body.detail as string | string[];
    const messages = Array.isArray(detail) ? detail : [String(detail)];
    expect(
      messages.some((message) =>
        message.includes('sortBy must be one of the following values'),
      ),
    ).toBe(true);
  });

  it('GET /api/redirects rejects invalid enabled query filter', async () => {
    const response = await request(getHttpServer())
      .get('/api/redirects?enabled=not-a-boolean')
      .expect(400);

    const detail = response.body.detail as string | string[];
    const messages = Array.isArray(detail) ? detail : [String(detail)];
    expect(
      messages.some((m) => m.includes('enabled must be a boolean value')),
    ).toBe(true);
  });
});
