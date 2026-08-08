/* eslint-disable @typescript-eslint/unbound-method */
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../../../modules/users/application/services/JwtTokenService';
import type { IUsersRepository } from '../../../modules/users/domain/IUsers.repository';
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

  it('devrait rejeter avec 403 quand emailVerified est false', async () => {
    givenVerifiedToken('user-unverified', 'unverified@b.com');
    usersRepo.findById.mockResolvedValue(
      buildUser({ id: 'user-unverified', emailVerified: false }),
    );

    const context = createMockContext(BEARER_VALID);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('devrait rejeter (401) quand le compte du JWT n existe plus', async () => {
    givenVerifiedToken('user-deleted', 'deleted@b.com');
    usersRepo.findById.mockResolvedValue(null);

    const context = createMockContext(BEARER_VALID);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devrait autoriser un email non verifie sur /auth/verify-email', async () => {
    givenVerifiedToken('user-unverified', 'unverified@b.com');

    const context = createMockContext(
      BEARER_VALID,
      '/api/v1/portfolio25/auth/verify-email',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('devrait autoriser un email non verifie sur /auth/logout', async () => {
    givenVerifiedToken('user-unverified', 'unverified@b.com');

    const context = createMockContext(
      BEARER_VALID,
      '/api/v1/portfolio25/auth/logout',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
