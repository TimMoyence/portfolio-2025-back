/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../../../modules/users/application/services/JwtTokenService';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtTokenService: jest.Mocked<JwtTokenService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jwtTokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtTokenService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(jwtTokenService, reflector);
  });

  function createMockContext(
    headers: Record<string, string | undefined> = {},
  ): ExecutionContext {
    const request = {
      headers,
    } as unknown as Record<string, unknown>;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('devrait autoriser avec un Bearer token valide', async () => {
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
});
