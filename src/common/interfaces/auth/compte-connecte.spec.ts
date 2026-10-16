import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../../../modules/users/application/services/JwtPayload';
import { buildJwtPayload } from '../../../../test/factories/user.factory';
import { compteConnecte } from './compte-connecte';

const requeteDe = (user?: JwtPayload) => ({ user }) as Request;

describe('compteConnecte', () => {
  it('rend l identifiant et les roles du compte que la garde a pose', () => {
    const requete = requeteDe(
      buildJwtPayload({ sub: 'user-7', roles: ['teacher'] }),
    );

    expect(compteConnecte(requete)).toEqual({
      id: 'user-7',
      roles: ['teacher'],
    });
  });

  it('leve 401 quand la garde n a pose aucun compte', () => {
    expect(() => compteConnecte(requeteDe())).toThrow(UnauthorizedException);
  });
});
