import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  applicationDeLaSuite,
  bootstrapTestApp,
  httpServerOf,
} from './helpers/nest-test-app';
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
  attendreCreationTransmise,
  attendreFiltreTransmis,
  attendreListeParDefaut,
  CAS_LEGACY,
  CAS_LEGACY_FILTRABLES,
  createLegacyUseCaseStubs,
  LEGACY_CONTROLLERS,
  legacyControllerProviders,
  legacyListBody,
  parametresDeListeParDefaut,
  primeLegacyUseCaseStubs,
} from './factories/legacy-contract.factory';

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const WRONG_PASSWORD = 'WrongPassword1!';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const NEW_PASSWORD = 'NewPassword123!';

describe('API coherence and connectivity (e2e http socket)', () => {
  const coreStubs = createCoreUseCaseStubs();
  const authStubs = createAuthUseCaseStubs();
  const legacyStubs = createLegacyUseCaseStubs();

  const { authenticateUserUseCase, resetPasswordUseCase } = authStubs;

  const app = applicationDeLaSuite(async () => {
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

    return bootstrapTestApp(moduleRef);
  });

  const getHttpServer = () => httpServerOf(app());

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

  beforeEach(() => {
    jest.clearAllMocks();

    primeCoreUseCaseStubs(coreStubs);
    primePasswordUseCaseStubs(authStubs);
    primeLegacyUseCaseStubs(legacyStubs);
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

  it.each(CAS_LEGACY)(
    'GET /api/%s exposes paginated contract',
    async (route, contexte) => {
      const response = await request(getHttpServer())
        .get(`/api/${route}`)
        .query(parametresDeListeParDefaut(contexte))
        .expect(200);

      expect(response.body).toEqual(legacyListBody(contexte.entite));
      attendreListeParDefaut(contexte, legacyStubs);
    },
  );

  it.each(CAS_LEGACY_FILTRABLES)(
    'GET /api/%s forwards optional list filters',
    async (route, contexte) => {
      await request(getHttpServer())
        .get(`/api/${route}`)
        .query({ ...contexte.filtre?.parametres })
        .expect(200);

      attendreFiltreTransmis(contexte, legacyStubs);
    },
  );

  it.each(CAS_LEGACY)(
    'POST /api/%s forwards payload to legacy use case',
    async (route, contexte) => {
      const response = await request(getHttpServer())
        .post(`/api/${route}`)
        .send(contexte.payload)
        .expect(201);

      attendreCreationTransmise(contexte, legacyStubs, response.body);
    },
  );

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
