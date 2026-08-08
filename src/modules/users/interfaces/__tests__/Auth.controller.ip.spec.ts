/* eslint-disable @typescript-eslint/unbound-method */
import type { Request, Response } from 'express';
import {
  createMockAuthAuditLogger,
  createMockUseCase,
} from '../../../../../test/factories/user.factory';
import type { AuthenticateGoogleUserUseCase } from '../../application/AuthenticateGoogleUser.useCase';
import type { AuthenticateUserUseCase } from '../../application/AuthenticateUser.useCase';
import type { AuthAuditLogger } from '../../application/services/AuthAuditLogger';
import { AuthController } from '../Auth.controller';
import type { GoogleAuthDto } from '../dto/GoogleAuth.dto';
import type { LoginDto } from '../dto/Login.dto';

describe('AuthController — IP tracee dans l’audit', () => {
  // Adresses de documentation RFC 5737, jamais routables.
  const FORGED_BY_CLIENT = '203.0.113.10';
  const RESOLVED_BY_EXPRESS = '198.51.100.10';
  const SOCKET_REMOTE_ADDRESS = '192.0.2.7';

  const loginDto = {
    email: 'marie@example.com',
    password: 'secret',
  } as LoginDto;
  const googleDto = { idToken: 'google-token' } as GoogleAuthDto;

  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  function buildRequest(ip: string | undefined): Request {
    return {
      ip,
      socket: { remoteAddress: SOCKET_REMOTE_ADDRESS },
      headers: {
        'x-forwarded-for': `${FORGED_BY_CLIENT}, 203.0.113.11`,
        'user-agent': 'jest-agent',
      },
    } as unknown as Request;
  }

  function buildController(overrides: {
    auditLogger: AuthAuditLogger;
    authenticate?: AuthenticateUserUseCase;
    google?: AuthenticateGoogleUserUseCase;
  }): AuthController {
    const unused = {} as never;
    return new AuthController(
      overrides.authenticate ?? unused,
      overrides.google ?? unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      overrides.auditLogger,
    );
  }

  function lastEntry(auditLogger: AuthAuditLogger): {
    ip: string;
    event: string;
  } {
    const [entry] = jest.mocked(auditLogger.log).mock.calls[0] as [
      { ip: string; event: string },
    ];
    return entry;
  }

  it('journalise l’IP resolue sur un echec de connexion', async () => {
    const auditLogger = createMockAuthAuditLogger();
    const controller = buildController({
      auditLogger,
      authenticate: createMockUseCase<AuthenticateUserUseCase>({
        rejects: new Error('Invalid credentials'),
      }),
    });

    await expect(
      controller.login(loginDto, buildRequest(RESOLVED_BY_EXPRESS), res),
    ).rejects.toThrow();

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'LOGIN_FAILURE',
      ip: RESOLVED_BY_EXPRESS,
    });
  });

  it('journalise l’IP resolue sur une connexion reussie', async () => {
    const auditLogger = createMockAuthAuditLogger();
    const controller = buildController({
      auditLogger,
      authenticate: createMockUseCase<AuthenticateUserUseCase>({
        resolves: {
          accessToken: 'a',
          refreshToken: 'r',
          user: { id: 'u-1', email: loginDto.email, roles: [] },
        },
      }),
    });

    await controller.login(loginDto, buildRequest(RESOLVED_BY_EXPRESS), res);

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'LOGIN_SUCCESS',
      ip: RESOLVED_BY_EXPRESS,
    });
  });

  it('journalise l’IP resolue sur l’authentification Google', async () => {
    const auditLogger = createMockAuthAuditLogger();
    const controller = buildController({
      auditLogger,
      google: createMockUseCase<AuthenticateGoogleUserUseCase>({
        rejects: new Error('Invalid Google token'),
      }),
    });

    await expect(
      controller.googleAuth(googleDto, buildRequest(RESOLVED_BY_EXPRESS), res),
    ).rejects.toThrow();

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'GOOGLE_AUTH_FAILURE',
      ip: RESOLVED_BY_EXPRESS,
    });
  });

  it('retombe sur l’adresse du socket, jamais sur X-Forwarded-For', async () => {
    const auditLogger = createMockAuthAuditLogger();
    const controller = buildController({
      auditLogger,
      authenticate: createMockUseCase<AuthenticateUserUseCase>({
        rejects: new Error('Invalid credentials'),
      }),
    });

    await expect(
      controller.login(loginDto, buildRequest(undefined), res),
    ).rejects.toThrow();

    expect(lastEntry(auditLogger).ip).toBe(SOCKET_REMOTE_ADDRESS);
  });
});
