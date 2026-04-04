import {
  BadRequestException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { firstValueFrom, of, toArray } from 'rxjs';
import { CreateAuditRequestsUseCase } from '../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../src/modules/audit-requests/application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../src/modules/audit-requests/application/StreamAuditEvents.useCase';
import { AuditsController } from '../src/modules/audit-requests/interfaces/Audits.controller';
import { AuditRequestRequestDto } from '../src/modules/audit-requests/interfaces/dto/audit-request.request.dto';
import { CreateContactsUseCase } from '../src/modules/contacts/application/CreateContacts.useCase';
import { ContactsController } from '../src/modules/contacts/interfaces/Contacts.controller';
import { ContactRequestDto } from '../src/modules/contacts/interfaces/dto/contact.request.dto';
import { CreateCookieConsentsUseCase } from '../src/modules/cookie-consents/application/CreateCookieConsents.useCase';
import { CookieConsentsController } from '../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { CookieConsentRequestDto } from '../src/modules/cookie-consents/interfaces/dto/cookie-consent.request.dto';
import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../src/modules/users/application/SetPassword.useCase';
import { UpdateProfileUseCase } from '../src/modules/users/application/UpdateProfile.useCase';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';
import { ForgotPasswordDto } from '../src/modules/users/interfaces/dto/ForgotPassword.dto';
import { LoginDto } from '../src/modules/users/interfaces/dto/Login.dto';
import { ResetPasswordDto } from '../src/modules/users/interfaces/dto/ResetPassword.dto';
import { SetPasswordDto } from '../src/modules/users/interfaces/dto/SetPassword.dto';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';

describe('API coherence and connectivity (e2e transportless)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const createContactsUseCase = { execute: jest.fn() };
  const createCookieConsentsUseCase = { execute: jest.fn() };
  const createAuditRequestsUseCase = { execute: jest.fn() };
  const getAuditSummaryUseCase = { execute: jest.fn() };
  const streamAuditEventsUseCase = { execute: jest.fn() };
  const authenticateUserUseCase = { execute: jest.fn() };
  const authenticateGoogleUserUseCase = { execute: jest.fn() };
  const createUsersUseCase = { execute: jest.fn() };
  const changePasswordUseCase = { execute: jest.fn() };
  const refreshTokensUseCase = { execute: jest.fn() };
  const revokeTokenUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const setPasswordUseCase = { execute: jest.fn() };
  const updateProfileUseCase = { execute: jest.fn() };

  let contactsController: ContactsController;
  let cookieConsentsController: CookieConsentsController;
  let auditsController: AuditsController;
  let authController: AuthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        ContactsController,
        CookieConsentsController,
        AuditsController,
        AuthController,
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
        { provide: RefreshTokensUseCase, useValue: refreshTokensUseCase },
        { provide: RevokeTokenUseCase, useValue: revokeTokenUseCase },
        {
          provide: RequestPasswordResetUseCase,
          useValue: requestPasswordResetUseCase,
        },
        {
          provide: ResetPasswordUseCase,
          useValue: resetPasswordUseCase,
        },
        { provide: SetPasswordUseCase, useValue: setPasswordUseCase },
        { provide: UpdateProfileUseCase, useValue: updateProfileUseCase },
        {
          provide: USERS_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    contactsController = moduleRef.get(ContactsController);
    cookieConsentsController = moduleRef.get(CookieConsentsController);
    auditsController = moduleRef.get(AuditsController);
    authController = moduleRef.get(AuthController);
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

    authenticateUserUseCase.execute.mockResolvedValue({
      accessToken: 'jwt-token',
      expiresIn: 900,
      refreshToken: 'raw-refresh-token',
      user: {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: null,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedOrCreatedBy: 'system',
      },
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

  function makeRequestMock(
    headers: Record<string, string | undefined>,
    ip = '127.0.0.1',
  ): Request {
    return {
      headers,
      ip,
      get(name: string) {
        return headers[name.toLowerCase()];
      },
    } as unknown as Request;
  }

  it('creates a contact from a validated payload and returns HTTP contract shape', async () => {
    const dto = await validateBody(
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        message: 'Hello, I need help with a premium implementation.',
        subject: 'Need support',
        role: 'CTO',
        terms: true,
      },
      ContactRequestDto,
    );

    const response = await contactsController.create(dto);

    expect(response).toEqual({
      message: 'Contact request created successfully.',
      httpCode: 201,
    });
    expect(createContactsUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('rejects non-whitelisted fields with global validation policy', async () => {
    await expect(
      validateBody(
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          message: 'Hello, I need help with a premium implementation.',
          subject: 'Need support',
          role: 'CTO',
          terms: true,
          injected: 'forbidden',
        },
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
      '10.0.0.2',
    );

    const response = await cookieConsentsController.create(dto, req);

    expect(response).toEqual({
      message: 'Cookie consent recorded successfully.',
      httpCode: 201,
    });
    expect(createCookieConsentsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        ip: '203.0.113.10',
        userAgent: 'e2e-test-agent',
        referer: 'https://example.com/en/pricing',
      }),
    );
  });

  it('creates audit request and resolves locale from referer when locale is omitted', async () => {
    const dto = await validateBody(
      {
        websiteName: 'Example Studio',
        contactMethod: 'EMAIL',
        contactValue: 'hello@example.com',
      },
      AuditRequestRequestDto,
    );
    const req = makeRequestMock({ referer: 'https://example.com/en/contact' });

    const response = await auditsController.create(dto, req);

    expect(response).toEqual({
      message: 'Audit request created successfully.',
      httpCode: 201,
      auditId: 'audit-1',
      status: 'PENDING',
    });
    expect(createAuditRequestsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
      }),
    );
  });

  it('returns summary snapshot for a given audit id', async () => {
    const response = await auditsController.summary('audit-1');

    expect(response).toEqual({
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
      { email: 'john@example.com', password: 'WrongPassword1!' },
      LoginDto,
    );

    await expect(authController.login(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns generic message for forgot password flow', async () => {
    const dto = await validateBody(
      { email: 'john@example.com' },
      ForgotPasswordDto,
    );

    const response = await authController.forgotPassword(dto);

    expect(response).toEqual({
      message:
        'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
    });
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
        newPassword: 'NewPassword123!',
      },
      ResetPasswordDto,
    );

    await expect(authController.resetPassword(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('injects user id from JWT payload when setting password', async () => {
    const dto = await validateBody(
      { newPassword: 'NewPassword123!' },
      SetPasswordDto,
    );
    const req = {
      user: { sub: 'user-1' },
    } as unknown as Request;

    const response = await authController.setPassword(dto, req);

    expect(setPasswordUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        newPassword: 'NewPassword123!',
      }),
    );
    expect(response.id).toBe('user-1');
  });
});
