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
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';

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
    const request = {
      headers,
      path,
    } as unknown as Record<string, unknown>;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('devrait autoriser avec un Bearer token valide et email verifie', async () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      iat: 1000,
      exp: 9999999999,
      iss: 'portfolio-2025',
      aud: 'portfolio-2025-api',
      roles: [],
    };
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);
    usersRepo.findById.mockResolvedValue(buildUser({ emailVerified: true }));

    const context = createMockContext({
      authorization: 'Bearer valid-token',
    });

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
    const payload = {
      sub: 'user-unverified',
      email: 'unverified@b.com',
      iat: 1000,
      exp: 9999999999,
      iss: 'portfolio-2025',
      aud: 'portfolio-2025-api',
      roles: [],
    };
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);
    usersRepo.findById.mockResolvedValue(
      buildUser({ id: 'user-unverified', emailVerified: false }),
    );

    const context = createMockContext({
      authorization: 'Bearer valid-token',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('devrait autoriser un email non verifie sur /auth/verify-email', async () => {
    const payload = {
      sub: 'user-unverified',
      email: 'unverified@b.com',
      iat: 1000,
      exp: 9999999999,
      iss: 'portfolio-2025',
      aud: 'portfolio-2025-api',
      roles: [],
    };
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);
    // Pas besoin de mock usersRepo ici car le path est exempt

    const context = createMockContext(
      { authorization: 'Bearer valid-token' },
      '/api/v1/portfolio25/auth/verify-email',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('devrait autoriser un email non verifie sur /auth/logout', async () => {
    const payload = {
      sub: 'user-unverified',
      email: 'unverified@b.com',
      iat: 1000,
      exp: 9999999999,
      iss: 'portfolio-2025',
      aud: 'portfolio-2025-api',
      roles: [],
    };
    jwtTokenService.verify.mockResolvedValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);

    const context = createMockContext(
      { authorization: 'Bearer valid-token' },
      '/api/v1/portfolio25/auth/logout',
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
