import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../../application/services/JwtPayload';
import { buildJwtPayload } from '../../../../../test/factories/user.factory';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  /**
   * Cree un ExecutionContext simule avec un user optionnel
   * attache a la requete (comme le ferait JwtAuthGuard).
   */
  function createMockContext(user?: JwtPayload | null): ExecutionContext {
    const request: Record<string, unknown> = {};
    if (user !== null && user !== undefined) {
      request['user'] = user;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('devrait autoriser si aucun role n est requis (@Roles non defini)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser si @Roles est defini avec un tableau vide', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser si l utilisateur possede un des roles requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'budget']);
    const payload = buildJwtPayload({ roles: ['budget'] });
    const context = createMockContext(payload);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait autoriser si l utilisateur possede tous les roles requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin', 'budget']);
    const payload = buildJwtPayload({ roles: ['admin', 'budget', 'weather'] });
    const context = createMockContext(payload);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait rejeter avec ForbiddenException si l utilisateur n a aucun role requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const payload = buildJwtPayload({ roles: ['budget'] });
    const context = createMockContext(payload);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('devrait rejeter avec ForbiddenException si aucun user sur la requete', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('devrait rejeter si user.roles est un tableau vide', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    const payload = buildJwtPayload({ roles: [] });
    const context = createMockContext(payload);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('devrait verifier les roles avec getAllAndOverride sur handler et classe', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext();

    guard.canActivate(context);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.arrayContaining([expect.any(Function), expect.any(Function)]),
    );
  });
});
