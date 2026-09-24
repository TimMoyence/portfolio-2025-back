/* eslint-disable @typescript-eslint/unbound-method */
import type { Request, Response } from 'express';
import {
  createMockAuthAuditLogger,
  createMockUseCase,
} from '../../../../../test/factories/user.factory';
import { AuthController } from '../Auth.controller';
import type { GoogleAuthDto } from '../dto/GoogleAuth.dto';
import type { LoginDto } from '../dto/Login.dto';

type Flux = 'login' | 'google';
type Issue = { resolves: unknown } | { rejects: Error };

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

  const ECHEC_LOGIN: Issue = { rejects: new Error('Invalid credentials') };
  const ECHEC_GOOGLE: Issue = { rejects: new Error('Invalid Google token') };
  const succes = (id: string, email: string): Issue => ({
    resolves: {
      accessToken: 'a',
      refreshToken: 'r',
      user: { id, email, roles: [] },
    },
  });

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

  async function entreeDAudit(
    flux: Flux,
    issue: Issue,
    ip: string | null = RESOLVED_BY_EXPRESS,
  ): Promise<Record<string, unknown>> {
    const auditLogger = createMockAuthAuditLogger();
    const unused = {} as never;
    const useCase = createMockUseCase<never>(issue);
    const controller = new AuthController(
      flux === 'login' ? useCase : unused,
      flux === 'google' ? useCase : unused,
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
      auditLogger,
    );
    const requete = buildRequest(ip ?? undefined);
    const appel =
      flux === 'login'
        ? controller.login(loginDto, requete, res)
        : controller.googleAuth(googleDto, requete, res);
    if ('rejects' in issue) {
      await expect(appel).rejects.toThrow();
    } else {
      await appel;
    }
    const [entry] = jest.mocked(auditLogger.log).mock.calls[0];
    return { ...entry };
  }

  it.each([
    ['un echec de connexion', 'login', ECHEC_LOGIN, 'LOGIN_FAILURE'],
    [
      'une connexion reussie',
      'login',
      succes('u-1', 'marie@example.com'),
      'LOGIN_SUCCESS',
    ],
    [
      'l’authentification Google',
      'google',
      ECHEC_GOOGLE,
      'GOOGLE_AUTH_FAILURE',
    ],
  ] as const)(
    'journalise l’IP resolue sur %s',
    async (_label, flux, issue, event) => {
      expect(await entreeDAudit(flux, issue)).toMatchObject({
        event,
        ip: RESOLVED_BY_EXPRESS,
      });
    },
  );

  it('retombe sur l’adresse du socket, jamais sur X-Forwarded-For', async () => {
    const entree = await entreeDAudit('login', ECHEC_LOGIN, null);

    expect(entree.ip).toBe(SOCKET_REMOTE_ADDRESS);
  });

  it('journalise l’email saisi sur un echec de connexion', async () => {
    expect(await entreeDAudit('login', ECHEC_LOGIN)).toMatchObject({
      email: loginDto.email,
      details: 'Invalid credentials',
    });
  });

  it('journalise l’email du compte Google et son identifiant sur un succes', async () => {
    expect(
      await entreeDAudit('google', succes('u-2', 'google@example.com')),
    ).toMatchObject({
      event: 'GOOGLE_AUTH_SUCCESS',
      email: 'google@example.com',
      userId: 'u-2',
    });
  });

  it('ne journalise aucun email sur un echec Google', async () => {
    expect(await entreeDAudit('google', ECHEC_GOOGLE)).not.toHaveProperty(
      'email',
    );
  });
});
