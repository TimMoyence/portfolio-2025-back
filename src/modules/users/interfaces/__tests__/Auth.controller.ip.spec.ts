/* eslint-disable @typescript-eslint/unbound-method */
import type { Request, Response } from 'express';
import type { AuthAuditLogger } from '../../application/services/AuthAuditLogger';
import type { AuthenticateUserUseCase } from '../../application/AuthenticateUser.useCase';
import { AuthController } from '../Auth.controller';
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

  function buildRequest(): Request {
    return {
      ip: RESOLVED,
      socket: { remoteAddress: '172.18.0.5' },
      headers: {
        'x-forwarded-for': `${FORGED}, 10.0.0.1`,
        'user-agent': 'jest-agent',
      },
    } as unknown as Request;
  }

  function buildController(
    auditLogger: AuthAuditLogger,
    authenticate: AuthenticateUserUseCase,
  ): AuthController {
    const unused = {} as never;
    return new AuthController(
      authenticate,
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
      unused,
      auditLogger,
    );
  }

  const dto = { email: 'marie@example.com', password: 'secret' } as LoginDto;
  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  it('journalise l’IP resolue et non celle annoncee par le client (echec)', async () => {
    const auditLogger = { log: jest.fn() } as unknown as AuthAuditLogger;
    const authenticate = {
      execute: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
    } as unknown as AuthenticateUserUseCase;
    const controller = buildController(auditLogger, authenticate);

    await expect(controller.login(dto, buildRequest(), res)).rejects.toThrow();

    const [entry] = jest.mocked(auditLogger.log).mock.calls[0] as [
      { ip: string; event: string },
    ];
    expect(entry.event).toBe('LOGIN_FAILURE');
    expect(entry.ip).toBe(RESOLVED);
    expect(entry.ip).not.toBe(FORGED);
  });

  it('retombe sur l’adresse du socket, jamais sur X-Forwarded-For', async () => {
    // Cas discriminant : `req.ip` absent. L'ancien code repliait sur
    // `X-Forwarded-For`, c'est-a-dire sur une valeur fournie par le
    // client ; le repli correct est l'adresse du socket.
    const auditLogger = { log: jest.fn() } as unknown as AuthAuditLogger;
    const authenticate = {
      execute: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
    } as unknown as AuthenticateUserUseCase;
    const controller = buildController(auditLogger, authenticate);
    const req = {
      ip: undefined,
      socket: { remoteAddress: '172.18.0.5' },
      headers: {
        'x-forwarded-for': `${FORGED}, 10.0.0.1`,
        'user-agent': 'jest-agent',
      },
    } as unknown as Request;

    await expect(controller.login(dto, req, res)).rejects.toThrow();

    const [entry] = jest.mocked(auditLogger.log).mock.calls[0] as [
      { ip: string },
    ];
    expect(entry.ip).toBe('172.18.0.5');
    expect(entry.ip).not.toBe(FORGED);
    expect(entry.ip).not.toContain('203.0.113');
  });

  it('journalise l’IP resolue et non celle annoncee par le client (succes)', async () => {
    const auditLogger = { log: jest.fn() } as unknown as AuthAuditLogger;
    const authenticate = {
      execute: jest.fn().mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: 'u-1', email: dto.email, roles: [] },
      }),
    } as unknown as AuthenticateUserUseCase;
    const controller = buildController(auditLogger, authenticate);

    await controller.login(dto, buildRequest(), res);

    const [entry] = jest.mocked(auditLogger.log).mock.calls[0] as [
      { ip: string; event: string },
    ];
    expect(entry.event).toBe('LOGIN_SUCCESS');
    expect(entry.ip).toBe(RESOLVED);
    expect(entry.ip).not.toBe(FORGED);
  });
});
