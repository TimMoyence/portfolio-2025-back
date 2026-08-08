import type { Provider } from '@nestjs/common';
import { of } from 'rxjs';
import { CreateAuditRequestsUseCase } from '../../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import { GetAuditSummaryUseCase } from '../../src/modules/audit-requests/application/GetAuditSummary.useCase';
import { StreamAuditEventsUseCase } from '../../src/modules/audit-requests/application/StreamAuditEvents.useCase';
import { AuditsController } from '../../src/modules/audit-requests/interfaces/Audits.controller';
import { CreateContactsUseCase } from '../../src/modules/contacts/application/CreateContacts.useCase';
import { ContactsController } from '../../src/modules/contacts/interfaces/Contacts.controller';
import { CreateCookieConsentsUseCase } from '../../src/modules/cookie-consents/application/CreateCookieConsents.useCase';
import { CookieConsentsController } from '../../src/modules/cookie-consents/interfaces/CookieConsents.controller';
import { AuthenticateGoogleUserUseCase } from '../../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../../src/modules/users/application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../../src/modules/users/application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../../src/modules/users/application/CreateUsers.useCase';
import { GetCurrentUserUseCase } from '../../src/modules/users/application/GetCurrentUser.useCase';
import { RefreshTokensUseCase } from '../../src/modules/users/application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../../src/modules/users/application/RequestPasswordReset.useCase';
import { ResendVerificationEmailUseCase } from '../../src/modules/users/application/ResendVerificationEmail.useCase';
import { ResetPasswordUseCase } from '../../src/modules/users/application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../../src/modules/users/application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../../src/modules/users/application/SetPassword.useCase';
import { UpdateProfileUseCase } from '../../src/modules/users/application/UpdateProfile.useCase';
import { VerifyEmailUseCase } from '../../src/modules/users/application/VerifyEmail.useCase';
import { AuthAuditLogger } from '../../src/modules/users/application/services/AuthAuditLogger';
import { AuthController } from '../../src/modules/users/interfaces/Auth.controller';
import { USERS_REPOSITORY } from '../../src/modules/users/domain/token';
import { createMockUsersRepo } from './user.factory';

export const CORE_CONTROLLERS = [
  ContactsController,
  CookieConsentsController,
  AuditsController,
  AuthController,
];

export const CONTACT_PAYLOAD = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  message: 'Hello, I need help with a premium implementation.',
  subject: 'Need support',
  role: 'CTO',
  terms: true,
};

export const AUDIT_REQUEST_PAYLOAD = {
  websiteName: 'Example Studio',
  contactMethod: 'EMAIL',
  contactValue: 'hello@example.com',
};

export const CONTACT_CREATED_RESULT = {
  message: 'Contact request created successfully.',
};

export const COOKIE_CONSENT_RECORDED_RESULT = {
  message: 'Cookie consent recorded successfully.',
};

export const AUDIT_CREATED_RESULT = {
  message: 'Audit request created successfully.',
  auditId: 'audit-1',
  status: 'PENDING',
};

export const AUDIT_SUMMARY_RESULT = {
  auditId: 'audit-1',
  ready: true,
  status: 'COMPLETED',
  progress: 100,
  summaryText: 'Great foundation with clear quick wins.',
  keyChecks: { securityHeaders: true },
  quickWins: ['Improve title tags'],
  pillarScores: { seo: 80 },
};

export const CONTACT_CREATED_RESPONSE = {
  ...CONTACT_CREATED_RESULT,
  httpCode: 201,
};

export const COOKIE_CONSENT_RECORDED_RESPONSE = {
  ...COOKIE_CONSENT_RECORDED_RESULT,
  httpCode: 201,
};

export const AUDIT_CREATED_RESPONSE = {
  message: AUDIT_CREATED_RESULT.message,
  httpCode: 201,
  auditId: AUDIT_CREATED_RESULT.auditId,
  status: AUDIT_CREATED_RESULT.status,
};

export const PASSWORD_RESET_REQUESTED_RESULT = {
  message:
    'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
};

export const PASSWORD_RESET_DONE_RESULT = {
  message: 'Mot de passe reinitialise avec succes.',
};

export const SET_PASSWORD_RESULT = {
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
};

export function buildAuditProgressEvent() {
  return {
    type: 'progress',
    data: {
      auditId: 'audit-1',
      status: 'RUNNING',
      progress: 30,
      step: 'crawl',
      done: false,
      updatedAt: new Date().toISOString(),
    },
  };
}

export interface CoreUseCaseStubs {
  createContactsUseCase: { execute: jest.Mock };
  createCookieConsentsUseCase: { execute: jest.Mock };
  createAuditRequestsUseCase: { execute: jest.Mock };
  getAuditSummaryUseCase: { execute: jest.Mock };
  streamAuditEventsUseCase: { execute: jest.Mock };
}

export interface AuthUseCaseStubs {
  authenticateUserUseCase: { execute: jest.Mock };
  authenticateGoogleUserUseCase: { execute: jest.Mock };
  createUsersUseCase: { execute: jest.Mock };
  changePasswordUseCase: { execute: jest.Mock };
  refreshTokensUseCase: { execute: jest.Mock };
  revokeTokenUseCase: { execute: jest.Mock };
  requestPasswordResetUseCase: { execute: jest.Mock };
  resetPasswordUseCase: { execute: jest.Mock };
  setPasswordUseCase: { execute: jest.Mock };
  updateProfileUseCase: { execute: jest.Mock };
  getCurrentUserUseCase: { execute: jest.Mock };
  verifyEmailUseCase: { execute: jest.Mock };
  resendVerificationEmailUseCase: { execute: jest.Mock };
}

export function createCoreUseCaseStubs(): CoreUseCaseStubs {
  return {
    createContactsUseCase: { execute: jest.fn() },
    createCookieConsentsUseCase: { execute: jest.fn() },
    createAuditRequestsUseCase: { execute: jest.fn() },
    getAuditSummaryUseCase: { execute: jest.fn() },
    streamAuditEventsUseCase: { execute: jest.fn() },
  };
}

export function createAuthUseCaseStubs(): AuthUseCaseStubs {
  return {
    authenticateUserUseCase: { execute: jest.fn() },
    authenticateGoogleUserUseCase: { execute: jest.fn() },
    createUsersUseCase: { execute: jest.fn() },
    changePasswordUseCase: { execute: jest.fn() },
    refreshTokensUseCase: { execute: jest.fn() },
    revokeTokenUseCase: { execute: jest.fn() },
    requestPasswordResetUseCase: { execute: jest.fn() },
    resetPasswordUseCase: { execute: jest.fn() },
    setPasswordUseCase: { execute: jest.fn() },
    updateProfileUseCase: { execute: jest.fn() },
    getCurrentUserUseCase: { execute: jest.fn() },
    verifyEmailUseCase: { execute: jest.fn() },
    resendVerificationEmailUseCase: { execute: jest.fn() },
  };
}

export function coreControllerProviders(stubs: CoreUseCaseStubs): Provider[] {
  return [
    { provide: CreateContactsUseCase, useValue: stubs.createContactsUseCase },
    {
      provide: CreateCookieConsentsUseCase,
      useValue: stubs.createCookieConsentsUseCase,
    },
    {
      provide: CreateAuditRequestsUseCase,
      useValue: stubs.createAuditRequestsUseCase,
    },
    { provide: GetAuditSummaryUseCase, useValue: stubs.getAuditSummaryUseCase },
    {
      provide: StreamAuditEventsUseCase,
      useValue: stubs.streamAuditEventsUseCase,
    },
  ];
}

export function authControllerProviders(
  stubs: AuthUseCaseStubs,
  usersRepository: unknown = createMockUsersRepo(),
): Provider[] {
  return [
    {
      provide: AuthenticateUserUseCase,
      useValue: stubs.authenticateUserUseCase,
    },
    {
      provide: AuthenticateGoogleUserUseCase,
      useValue: stubs.authenticateGoogleUserUseCase,
    },
    { provide: CreateUsersUseCase, useValue: stubs.createUsersUseCase },
    { provide: ChangePasswordUseCase, useValue: stubs.changePasswordUseCase },
    { provide: RefreshTokensUseCase, useValue: stubs.refreshTokensUseCase },
    { provide: RevokeTokenUseCase, useValue: stubs.revokeTokenUseCase },
    {
      provide: RequestPasswordResetUseCase,
      useValue: stubs.requestPasswordResetUseCase,
    },
    { provide: ResetPasswordUseCase, useValue: stubs.resetPasswordUseCase },
    { provide: SetPasswordUseCase, useValue: stubs.setPasswordUseCase },
    { provide: UpdateProfileUseCase, useValue: stubs.updateProfileUseCase },
    { provide: GetCurrentUserUseCase, useValue: stubs.getCurrentUserUseCase },
    { provide: VerifyEmailUseCase, useValue: stubs.verifyEmailUseCase },
    {
      provide: ResendVerificationEmailUseCase,
      useValue: stubs.resendVerificationEmailUseCase,
    },
    AuthAuditLogger,
    { provide: USERS_REPOSITORY, useValue: usersRepository },
  ];
}

export function primeCoreUseCaseStubs(stubs: CoreUseCaseStubs): void {
  stubs.createContactsUseCase.execute.mockResolvedValue(CONTACT_CREATED_RESULT);
  stubs.createCookieConsentsUseCase.execute.mockResolvedValue(
    COOKIE_CONSENT_RECORDED_RESULT,
  );
  stubs.createAuditRequestsUseCase.execute.mockResolvedValue(
    AUDIT_CREATED_RESULT,
  );
  stubs.getAuditSummaryUseCase.execute.mockResolvedValue(AUDIT_SUMMARY_RESULT);
  stubs.streamAuditEventsUseCase.execute.mockReturnValue(
    of(buildAuditProgressEvent()),
  );
}

export function primePasswordUseCaseStubs(stubs: AuthUseCaseStubs): void {
  stubs.requestPasswordResetUseCase.execute.mockResolvedValue(
    PASSWORD_RESET_REQUESTED_RESULT,
  );
  stubs.resetPasswordUseCase.execute.mockResolvedValue(
    PASSWORD_RESET_DONE_RESULT,
  );
  stubs.setPasswordUseCase.execute.mockResolvedValue(SET_PASSWORD_RESULT);
}
