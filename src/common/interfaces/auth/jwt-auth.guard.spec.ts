/* eslint-disable @typescript-eslint/unbound-method */
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../../../modules/users/application/services/JwtTokenService';
import type { IUsersRepository } from '../../../modules/users/domain/IUsers.repository';
import type { User } from '../../../modules/users/domain/User';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import {
  buildJwtPayload,
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import { createHttpExecutionContext } from '../../../../test/factories/execution-context.factory';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let reflector: jest.Mocked<Reflector>;
  let usersRepo: jest.Mocked<IUsersRepository>;

  beforeEach(() => {
    jwtTokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    usersRepo = createMockUsersRepo();

    guard = new JwtAuthGuard(jwtTokenService, reflector, usersRepo);
  });

  function createMockContext(
    headers: Record<string, string | undefined> = {},
    path = '/api/v1/portfolio25/test',
  ): ExecutionContext {
    return createHttpExecutionContext({ headers, path });
  }

  const BEARER_VALID = { authorization: 'Bearer valid-token' };

  function givenVerifiedToken(sub: string, email: string) {
    const payload = buildJwtPayload({ sub, email });
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);
    return payload;
  }

  it('devrait autoriser avec un Bearer token valide et email verifie', async () => {
    const payload = givenVerifiedToken('user-1', 'a@b.com');
    usersRepo.findById.mockResolvedValue(buildUser({ emailVerified: true }));

    const context = createMockContext(BEARER_VALID);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    const request = context.switchToHttp().getRequest();
    expect(request['user']).toEqual(payload);
    expect(jwtTokenService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('devrait rejeter sans header Authorization', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devrait rejeter avec un token invalide', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtTokenService.verify.mockRejectedValue(new Error('Invalid signature'));

    const context = createMockContext({
      authorization: 'Bearer invalid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devrait passer les routes marquees @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtTokenService.verify).not.toHaveBeenCalled();
  });

  it('devrait rejeter un header Authorization sans prefixe Bearer', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devrait utiliser la bonne cle de metadata pour @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});

    await guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.arrayContaining([expect.any(Function), expect.any(Function)]),
    );
  });

  function givenAccount(compte: User | null) {
    givenVerifiedToken('user-1', 'a@b.com');
    usersRepo.findById.mockResolvedValue(compte);
  }

  const tentativePour = (compte: User | null) => {
    givenAccount(compte);
    return guard.canActivate(createMockContext(BEARER_VALID));
  };

  it('devrait rejeter avec 403 quand emailVerified est false', async () => {
    await expect(
      tentativePour(buildUser({ emailVerified: false })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('devrait rejeter (401) quand le compte du JWT n existe plus', async () => {
    await expect(tentativePour(null)).rejects.toThrow(UnauthorizedException);
  });

  it('devrait rejeter (401) un compte desactive dont le jeton d acces est encore valide', async () => {
    await expect(
      tentativePour(buildUser({ emailVerified: true, isActive: false })),
    ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
  });

  it('presente aux gardes suivantes les roles du compte en base, pas ceux du jeton', async () => {
    const payload = buildJwtPayload({ roles: ['admin', 'teacher'] });
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);
    usersRepo.findById.mockResolvedValue(
      buildUser({ emailVerified: true, roles: ['teacher'] }),
    );

    const context = createMockContext(BEARER_VALID);
    await guard.canActivate(context);

    expect(context.switchToHttp().getRequest()['user']).toEqual({
      ...payload,
      roles: ['teacher'],
    });
  });

  const givenUnverifiedAccount = () =>
    givenAccount(buildUser({ emailVerified: false }));

  it('devrait autoriser un email non verifie sur /auth/verify-email', async () => {
    givenUnverifiedAccount();

    const context = createMockContext(
      BEARER_VALID,
      '/api/v1/portfolio25/auth/verify-email',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('devrait autoriser un email non verifie sur /auth/logout', async () => {
    givenUnverifiedAccount();

    const context = createMockContext(
      BEARER_VALID,
      '/api/v1/portfolio25/auth/logout',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
