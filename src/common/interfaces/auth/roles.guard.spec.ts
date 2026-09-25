import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from '../../../modules/users/application/services/JwtPayload';
import { buildJwtPayload } from '../../../../test/factories/user.factory';
import { createHttpExecutionContext } from '../../../../test/factories/execution-context.factory';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: JwtPayload | null): ExecutionContext {
    return createHttpExecutionContext(user ? { user } : {});
  }

  function contexteExigeant(
    rolesRequis: string[] | undefined,
    rolesPortes?: string[],
  ): ExecutionContext {
    reflector.getAllAndOverride.mockReturnValue(rolesRequis);
    return createMockContext(
      rolesPortes === undefined
        ? undefined
        : buildJwtPayload({ roles: rolesPortes }),
    );
  }

  it.each<[string, string[] | undefined, string[] | undefined]>([
    [
      'devrait autoriser si aucun role n est requis (@Roles non defini)',
      undefined,
      undefined,
    ],
    [
      'devrait autoriser si @Roles est defini avec un tableau vide',
      [],
      undefined,
    ],
    [
      'devrait autoriser si l utilisateur possede un des roles requis',
      ['admin', 'teacher'],
      ['teacher'],
    ],
    [
      'devrait autoriser si l utilisateur possede tous les roles requis',
      ['admin', 'teacher'],
      ['admin', 'teacher'],
    ],
  ])('%s', (_titre, rolesRequis, rolesPortes) => {
    expect(guard.canActivate(contexteExigeant(rolesRequis, rolesPortes))).toBe(
      true,
    );
  });

  it.each<[string, string[] | undefined]>([
    [
      'devrait rejeter avec ForbiddenException si l utilisateur n a aucun role requis',
      ['teacher'],
    ],
    [
      'devrait rejeter avec ForbiddenException si aucun user sur la requete',
      undefined,
    ],
    ['devrait rejeter si user.roles est un tableau vide', []],
  ])('%s', (_titre, rolesPortes) => {
    const context = contexteExigeant(['admin'], rolesPortes);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('devrait verifier les roles avec getAllAndOverride sur handler et classe', () => {
    guard.canActivate(contexteExigeant(undefined));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.arrayContaining([expect.any(Function), expect.any(Function)]),
    );
  });
});
