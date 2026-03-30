/* eslint-disable @typescript-eslint/unbound-method */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../../application/services/JwtTokenService';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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

  it('devrait autoriser avec un Bearer token valide', () => {
    const payload = {
      sub: 'user-1',
      email: 'a@b.com',
      iat: 1000,
      exp: 9999999999,
      iss: 'portfolio-2025',
      aud: 'portfolio-2025-api',
      roles: [],
    };
    jwtTokenService.verify.mockReturnValue(payload);
    reflector.getAllAndOverride.mockReturnValue(false);

    const context = createMockContext({
      authorization: 'Bearer valid-token',
    });

    expect(guard.canActivate(context)).toBe(true);

    const request = context.switchToHttp().getRequest();
    expect(request['user']).toEqual(payload);
    expect(jwtTokenService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('devrait rejeter sans header Authorization', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait rejeter avec un token invalide', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtTokenService.verify.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const context = createMockContext({
      authorization: 'Bearer invalid-token',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait passer les routes marquees @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});

    expect(guard.canActivate(context)).toBe(true);
    expect(jwtTokenService.verify).not.toHaveBeenCalled();
  });

  it('devrait rejeter un header Authorization sans prefixe Bearer', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('devrait utiliser la bonne cle de metadata pour @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.arrayContaining([expect.any(Function), expect.any(Function)]),
    );
  });
});
