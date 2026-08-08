import {
  BadRequestException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { bootstrapTestApp, httpServerOf } from './helpers/nest-test-app';
import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import {
  AUDIT_CREATED_RESPONSE,
  AUDIT_REQUEST_PAYLOAD,
  AUDIT_SUMMARY_RESULT,
  authControllerProviders,
  CONTACT_CREATED_RESPONSE,
  CONTACT_PAYLOAD,
  CORE_CONTROLLERS,
  coreControllerProviders,
  createAuthUseCaseStubs,
  createCoreUseCaseStubs,
  PASSWORD_RESET_REQUESTED_RESULT,
  primeCoreUseCaseStubs,
  primePasswordUseCaseStubs,
} from './factories/core-api.factory';
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

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const WRONG_PASSWORD = 'WrongPassword1!';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const NEW_PASSWORD = 'NewPassword123!';

describe('API coherence and connectivity (e2e http socket)', () => {
  let app: INestApplication;

  const coreStubs = createCoreUseCaseStubs();
  const authStubs = createAuthUseCaseStubs();
  const legacyStubs = createLegacyUseCaseStubs();

  const { authenticateUserUseCase, resetPasswordUseCase } = authStubs;
  const {
    listServicesUseCase,
    createServicesUseCase,
    listProjectsUseCase,
    listCoursesUseCase,
    listRedirectsUseCase,
  } = legacyStubs;

  const getHttpServer = () => httpServerOf(app);

  function validationMessages(response: request.Response): string[] {
    const detail = (response.body.message ?? response.body.detail) as
      | string
      | string[];
    return Array.isArray(detail) ? detail : [String(detail)];
  }

  function expectValidationMessage(
    response: request.Response,
    fragment: string,
  ): void {
    expect(
      validationMessages(response).some((message) =>
        message.includes(fragment),
      ),
    ).toBe(true);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [...CORE_CONTROLLERS, ...LEGACY_CONTROLLERS],
      providers: [
        ...coreControllerProviders(coreStubs),
        ...authControllerProviders(authStubs),
        ...legacyControllerProviders(legacyStubs),
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = await bootstrapTestApp(moduleRef);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    primeCoreUseCaseStubs(coreStubs);
    primePasswordUseCaseStubs(authStubs);
    primeLegacyUseCaseStubs(legacyStubs);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/contacts validates payload and returns contract response', async () => {
    const response = await request(getHttpServer())
      .post('/api/contacts')
      .send(CONTACT_PAYLOAD)
      .expect(201);

    expect(response.body).toEqual(CONTACT_CREATED_RESPONSE);
  });

  it('POST /api/contacts forbids non-whitelisted fields', async () => {
    const response = await request(getHttpServer())
      .post('/api/contacts')
      .send({ ...CONTACT_PAYLOAD, injected: 'forbidden' })
      .expect(400);

    expectValidationMessage(response, 'property injected should not exist');
  });

  it('POST /api/audits resolves locale from referer when not provided', async () => {
    const response = await request(getHttpServer())
      .post('/api/audits')
      .set('referer', 'https://example.com/en/contact')
      .send(AUDIT_REQUEST_PAYLOAD)
      .expect(201);

    expect(response.body).toEqual(AUDIT_CREATED_RESPONSE);
  });

  it('GET /api/audits/:id/summary returns summary snapshot', async () => {
    const response = await request(getHttpServer())
      .get('/api/audits/00000000-0000-4000-a000-000000000001/summary')
      .expect(200);

    expect(response.body).toEqual(AUDIT_SUMMARY_RESULT);
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

    const response = await request(getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: WRONG_PASSWORD,
      })
      .expect(401);

    expect(response.status).toBe(401);
  });

  it('POST /api/auth/forgot-password returns generic success message', async () => {
    const response = await request(getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'john@example.com' })
      .expect(200);

    expect(response.body).toEqual(PASSWORD_RESET_REQUESTED_RESULT);
  });

  it('POST /api/auth/reset-password returns 400 when token is invalid', async () => {
    resetPasswordUseCase.execute.mockRejectedValueOnce(
      new BadRequestException('Invalid token'),
    );

    const response = await request(getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token:
          '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
        newPassword: NEW_PASSWORD,
      })
      .expect(400);

    expect(response.status).toBe(400);
  });

  it('GET /api/services exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/services?page=1&limit=20&sortBy=order&order=ASC')
      .expect(200);

    expect(response.body).toEqual(legacyListBody(LEGACY_SERVICE));
    expect(listServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICES_DEFAULT_QUERY,
    );
  });

  it('GET /api/projects exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/projects?page=1&limit=20&sortBy=order&order=ASC')
      .expect(200);

    expect(response.body).toEqual(legacyListBody(LEGACY_PROJECT));
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_PROJECTS_DEFAULT_QUERY,
    );
  });

  it('GET /api/courses exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/courses?page=1&limit=20&sortBy=createdAt&order=DESC')
      .expect(200);

    expect(response.body).toEqual(legacyListBody(LEGACY_COURSE));
    expect(listCoursesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_COURSES_DEFAULT_QUERY,
    );
  });

  it('GET /api/redirects exposes paginated contract', async () => {
    const response = await request(getHttpServer())
      .get('/api/redirects?page=1&limit=20&sortBy=createdAt&order=DESC')
      .expect(200);

    expect(response.body).toEqual(legacyListBody(LEGACY_REDIRECT));
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_REDIRECTS_DEFAULT_QUERY,
    );
  });

  it('GET legacy endpoints forward optional list filters', async () => {
    await request(getHttpServer())
      .get(
        '/api/services?page=2&limit=5&sortBy=createdAt&order=DESC&status=DRAFT',
      )
      .expect(200);
    expect(listServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICES_FILTERED_QUERY,
    );

    await request(getHttpServer())
      .get(
        '/api/projects?page=3&limit=10&sortBy=type&order=ASC&type=SIDE&status=PUBLISHED',
      )
      .expect(200);
    expect(listProjectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_PROJECTS_FILTERED_QUERY,
    );

    await request(getHttpServer())
      .get(
        '/api/redirects?page=1&limit=50&sortBy=clicks&order=DESC&enabled=false',
      )
      .expect(200);
    expect(listRedirectsUseCase.execute).toHaveBeenCalledWith(
      LEGACY_REDIRECTS_FILTERED_QUERY,
    );
  });

  it('POST /api/services forwards payload to legacy services use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/services')
      .send(LEGACY_SERVICE_PAYLOAD)
      .expect(201);

    expect(createServicesUseCase.execute).toHaveBeenCalledWith(
      LEGACY_SERVICE_PAYLOAD,
    );
    expect(response.body).toEqual(LEGACY_SERVICE);
  });

  it('POST /api/projects forwards payload to legacy projects use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/projects')
      .send(LEGACY_PROJECT_PAYLOAD)
      .expect(201);

    expect(response.body).toEqual(LEGACY_PROJECT);
  });

  it('POST /api/courses forwards payload to legacy courses use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/courses')
      .send(LEGACY_COURSE_PAYLOAD)
      .expect(201);

    expect(response.body).toEqual(LEGACY_COURSE);
  });

  it('POST /api/redirects forwards payload to legacy redirects use case', async () => {
    const response = await request(getHttpServer())
      .post('/api/redirects')
      .send(LEGACY_REDIRECT_PAYLOAD)
      .expect(201);

    expect(response.body).toEqual(LEGACY_REDIRECT);
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

    expectValidationMessage(response, 'property injected should not exist');
  });

  it('GET /api/services rejects invalid sort query', async () => {
    const response = await request(getHttpServer())
      .get('/api/services?sortBy=invalid')
      .expect(400);

    expectValidationMessage(
      response,
      'sortBy must be one of the following values',
    );
  });

  it('GET /api/redirects rejects invalid enabled query filter', async () => {
    const response = await request(getHttpServer())
      .get('/api/redirects?enabled=not-a-boolean')
      .expect(400);

    expectValidationMessage(response, 'enabled must be a boolean value');
  });
});
