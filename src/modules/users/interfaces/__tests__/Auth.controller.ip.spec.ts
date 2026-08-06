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

/**
 * Verrouille l'IP tracee par l'audit d'authentification.
 *
 * `X-Forwarded-For` est fourni en entier par le client : en retenir une
 * entree ferait porter les tentatives de connexion — reussies comme
 * echouees — a une adresse choisie par l'appelant. Aucun test
 * n'exercait `extractIp`, si bien qu'un retour au motif vulnerable
 * passait la CI sans etre vu.
 */
describe('AuthController — IP tracee dans l’audit', () => {
  const FORGED = '203.0.113.10';
  const RESOLVED = '10.0.0.2';
  const SOCKET = '172.18.0.5';

  const loginDto = {
    email: 'marie@example.com',
    password: 'secret',
  } as LoginDto;
  const googleDto = { idToken: 'google-token' } as GoogleAuthDto;

  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  /**
   * Requete portant un `X-Forwarded-For` forge, comme en production.
   *
   * `ip` est passe explicitement : une valeur par defaut serait
   * reappliquee lorsqu'on transmet `undefined`, et le cas « req.ip
   * absent » — le seul discriminant — ne serait jamais teste.
   */
  function buildRequest(ip: string | undefined): Request {
    return {
      ip,
      socket: { remoteAddress: SOCKET },
      headers: {
        'x-forwarded-for': `${FORGED}, 10.0.0.1`,
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

  /** Derniere entree d'audit enregistree. */
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
      controller.login(loginDto, buildRequest(RESOLVED), res),
    ).rejects.toThrow();

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'LOGIN_FAILURE',
      ip: RESOLVED,
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

    await controller.login(loginDto, buildRequest(RESOLVED), res);

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'LOGIN_SUCCESS',
      ip: RESOLVED,
    });
  });

  it('journalise l’IP resolue sur l’authentification Google', async () => {
    // Second site d'appel de `extractIp` : une reintroduction du motif
    // vulnerable directement dans `googleAuth` resterait invisible si
    // seul `login` etait couvert.
    const auditLogger = createMockAuthAuditLogger();
    const controller = buildController({
      auditLogger,
      google: createMockUseCase<AuthenticateGoogleUserUseCase>({
        rejects: new Error('Invalid Google token'),
      }),
    });

    await expect(
      controller.googleAuth(googleDto, buildRequest(RESOLVED), res),
    ).rejects.toThrow();

    expect(lastEntry(auditLogger)).toMatchObject({
      event: 'GOOGLE_AUTH_FAILURE',
      ip: RESOLVED,
    });
  });

  it('retombe sur l’adresse du socket, jamais sur X-Forwarded-For', async () => {
    // Cas discriminant : `req.ip` absent. L'ancien code repliait sur
    // `X-Forwarded-For`, c'est-a-dire sur une valeur fournie par le
    // client ; le repli correct est l'adresse du socket.
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

    expect(lastEntry(auditLogger).ip).toBe(SOCKET);
  });
});
