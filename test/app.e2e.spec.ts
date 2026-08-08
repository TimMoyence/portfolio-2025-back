import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { firstValueFrom, toArray } from 'rxjs';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { AuditRequestRequestDto } from '../src/modules/audit-requests/interfaces/dto/audit-request.request.dto';
import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { ContactRequestDto } from '../src/modules/contacts/interfaces/dto/contact.request.dto';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { CookieConsentRequestDto } from '../src/modules/cookie-consents/interfaces/dto/cookie-consent.request.dto';
import { ForgotPasswordDto } from '../src/modules/users/interfaces/dto/ForgotPassword.dto';
import { LoginDto } from '../src/modules/users/interfaces/dto/Login.dto';
import { ResetPasswordDto } from '../src/modules/users/interfaces/dto/ResetPassword.dto';
import { SetPasswordDto } from '../src/modules/users/interfaces/dto/SetPassword.dto';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import {
  AUDIT_REQUEST_PAYLOAD,
  AUDIT_CREATED_RESPONSE,
  AUDIT_SUMMARY_RESULT,
  authControllerProviders,
  CONTACT_CREATED_RESPONSE,
  CONTACT_PAYLOAD,
  COOKIE_CONSENT_RECORDED_RESPONSE,
  CORE_CONTROLLERS,
  coreControllerProviders,
  createAuthUseCaseStubs,
  createCoreUseCaseStubs,
  PASSWORD_RESET_REQUESTED_RESULT,
  primeCoreUseCaseStubs,
  primePasswordUseCaseStubs,
} from './factories/core-api.factory';
import { buildAuthResult, buildUser } from './factories/user.factory';
import { validateBody } from './helpers/validation-pipe';

// eslint-disable-next-line sonarjs/no-hardcoded-ip -- fixture de test : plage privee RFC 1918, pas une adresse reelle
const RESOLVED_CLIENT_IP = '10.0.0.2';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const WRONG_PASSWORD = 'WrongPassword1!';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const NEW_PASSWORD = 'NewPassword123!';

describe('API coherence and connectivity (e2e transportless)', () => {
  const coreStubs = createCoreUseCaseStubs();
  const authStubs = createAuthUseCaseStubs();

  const {
    createContactsUseCase,
    createCookieConsentsUseCase,
    createAuditRequestsUseCase,
  } = coreStubs;
  const {
    authenticateUserUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
    setPasswordUseCase,
  } = authStubs;

  let contactsController: ContactsController;
  let cookieConsentsController: CookieConsentsController;
  let auditsController: AuditsController;
  let authController: AuthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: CORE_CONTROLLERS,
      providers: [
        ...coreControllerProviders(coreStubs),
        ...authControllerProviders(authStubs),
      ],
    }).compile();

    contactsController = moduleRef.get(ContactsController);
    cookieConsentsController = moduleRef.get(CookieConsentsController);
    auditsController = moduleRef.get(AuditsController);
    authController = moduleRef.get(AuthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    primeCoreUseCaseStubs(coreStubs);
    primePasswordUseCaseStubs(authStubs);

    authenticateUserUseCase.execute.mockResolvedValue(
      buildAuthResult({
        user: buildUser({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          updatedOrCreatedBy: 'system',
        }),
      }),
    );
  });

  function makeRequestMock(
    headers: Record<string, string | undefined>,
    ip = '127.0.0.1',
  ): Request {
    return {
      headers,
      ip,
      cookies: {},
      get(name: string) {
        return headers[name.toLowerCase()];
      },
    } as unknown as Request;
  }

  function makeResponseMock(): Response {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis() as unknown as Response['cookie'],
      clearCookie: jest
        .fn()
        .mockReturnThis() as unknown as Response['clearCookie'],
    };
    return res as Response;
  }

  function firstCommand<T>(useCaseStub: { execute: jest.Mock }): T {
    const [command] = useCaseStub.execute.mock.calls[0] as [T];
    return command;
  }

  it('creates a contact from a validated payload and returns HTTP contract shape', async () => {
    const dto = await validateBody(CONTACT_PAYLOAD, ContactRequestDto);

    const response = await contactsController.create(dto);

    expect(response).toEqual(CONTACT_CREATED_RESPONSE);
    expect(createContactsUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('rejects non-whitelisted fields with global validation policy', async () => {
    await expect(
      validateBody(
        { ...CONTACT_PAYLOAD, injected: 'forbidden' },
        ContactRequestDto,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createContactsUseCase.execute).not.toHaveBeenCalled();
  });

  it('creates cookie consent and forwards request metadata to the use case', async () => {
    const dto = await validateBody(
      {
        policyVersion: '2026-02-11',
        locale: 'en',
        region: 'EU_UK',
        source: 'banner',
        action: 'accept_all',
        preferences: {
          essential: true,
          preferences: true,
          analytics: false,
          marketing: false,
        },
      },
      CookieConsentRequestDto,
    );
    const req = makeRequestMock(
      {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'e2e-test-agent',
        referer: 'https://example.com/en/pricing',
      },
      RESOLVED_CLIENT_IP,
    );

    const response = await cookieConsentsController.create(dto, req);

    expect(response).toEqual(COOKIE_CONSENT_RECORDED_RESPONSE);
    // L'IP persistee au titre du RGPD est celle resolue par Express sous
    // `trust proxy`, jamais la premiere entree de `X-Forwarded-For` :
    // cette derniere est fournie par le client, qui choisirait alors
    // l'identite sous laquelle son consentement est enregistre.
    expect(createCookieConsentsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: RESOLVED_CLIENT_IP,
        userAgent: 'e2e-test-agent',
        referer: 'https://example.com/en/pricing',
      }),
    );
    const command = firstCommand<{ ip: string | null }>(
      createCookieConsentsUseCase,
    );
    expect(command.ip).not.toBe('203.0.113.10');
  });

  it('creates audit request and resolves locale from referer when locale is omitted', async () => {
    const dto = await validateBody(
      AUDIT_REQUEST_PAYLOAD,
      AuditRequestRequestDto,
    );
    const req = makeRequestMock({ referer: 'https://example.com/en/contact' });

    const response = await auditsController.create(dto, req);

    expect(response).toEqual(AUDIT_CREATED_RESPONSE);
    expect(createAuditRequestsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
      }),
    );
  });

  it('records the resolved client ip on an audit request, never the forged header', async () => {
    const dto = await validateBody(
      { ...AUDIT_REQUEST_PAYLOAD, locale: 'fr' },
      AuditRequestRequestDto,
    );
    const req = makeRequestMock(
      { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
      RESOLVED_CLIENT_IP,
    );

    await auditsController.create(dto, req);

    const command = firstCommand<{ ip: string | null }>(
      createAuditRequestsUseCase,
    );
    expect(command.ip).toBe(RESOLVED_CLIENT_IP);
    expect(command.ip).not.toBe('203.0.113.10');
  });

  it('returns summary snapshot for a given audit id', async () => {
    const response = await auditsController.summary('audit-1');

    expect(response).toEqual(AUDIT_SUMMARY_RESULT);
  });

  it('streams audit events in SSE message format', async () => {
    const events = await firstValueFrom(
      auditsController.stream('audit-1').pipe(toArray()),
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('progress');
    expect(events[0].data).toEqual(
      expect.objectContaining({
        auditId: 'audit-1',
        status: 'RUNNING',
      }),
    );
  });

  it('returns unauthorized error for invalid auth credentials', async () => {
    authenticateUserUseCase.execute.mockRejectedValueOnce(
      new UnauthorizedException('Invalid credentials'),
    );
    const dto = await validateBody(
      { email: 'john@example.com', password: WRONG_PASSWORD },
      LoginDto,
    );

    const req = makeRequestMock({ 'user-agent': 'test-agent' });
    const res = makeResponseMock();
    await expect(authController.login(dto, req, res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns generic message for forgot password flow', async () => {
    const dto = await validateBody(
      { email: 'john@example.com' },
      ForgotPasswordDto,
    );

    const response = await authController.forgotPassword(dto);

    expect(response).toEqual(PASSWORD_RESET_REQUESTED_RESULT);
    expect(requestPasswordResetUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('returns bad request for invalid reset token', async () => {
    resetPasswordUseCase.execute.mockRejectedValueOnce(
      new BadRequestException('Invalid token'),
    );
    const dto = await validateBody(
      {
        token:
          '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
        newPassword: NEW_PASSWORD,
      },
      ResetPasswordDto,
    );

    await expect(authController.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('injects user id from JWT payload when setting password', async () => {
    const dto = await validateBody(
      { newPassword: NEW_PASSWORD },
      SetPasswordDto,
    );
    const req = {
      user: { sub: 'user-1' },
    } as unknown as Request;

    const response = await authController.setPassword(dto, req);

    expect(setPasswordUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        newPassword: NEW_PASSWORD,
      }),
    );
    expect(response.id).toBe('user-1');
  });
});
