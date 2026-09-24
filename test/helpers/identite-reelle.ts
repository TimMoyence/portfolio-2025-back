import type { INestApplication, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { createHmac } from 'node:crypto';
import { JwtAuthGuard } from '../../src/common/interfaces/auth/jwt-auth.guard';
import { JwtTokenService } from '../../src/modules/users/application/services/JwtTokenService';
import { USERS_REPOSITORY } from '../../src/modules/users/domain/token';
import { buildUser, createMockUsersRepo } from '../factories/user.factory';

export const EN_TETE_IDENTITE = 'x-test-identite';

const SECRET_JWT_DE_TEST = 'secret-jwt-des-tests-formations-0123456789';
const EMETTEUR = 'portfolio-2025';
const AUDIENCE = 'portfolio-2025-api';
const DUREE_DE_VIE_S = 900;

function base64url(valeur: object): string {
  return Buffer.from(JSON.stringify(valeur)).toString('base64url');
}

export function jetonSigne(
  sub: string,
  roles: readonly string[],
  secret: string = SECRET_JWT_DE_TEST,
): string {
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url({ alg: 'HS256', typ: 'JWT', kid: 'v1' });
  const charge = base64url({
    sub,
    email: `${sub}@formations.test`,
    roles,
    iat: maintenant,
    exp: maintenant + DUREE_DE_VIE_S,
    iss: EMETTEUR,
    aud: AUDIENCE,
  });
  const signature = createHmac('sha256', secret)
    .update(`${entete}.${charge}`)
    .digest('base64url');
  return `${entete}.${charge}.${signature}`;
}

export function authentificationReelle(): Provider[] {
  const utilisateurs = createMockUsersRepo();
  utilisateurs.findById.mockImplementation((id: string) =>
    Promise.resolve(buildUser({ id, emailVerified: true })),
  );
  return [
    {
      provide: ConfigService,
      useValue: new ConfigService({ JWT_SECRET: SECRET_JWT_DE_TEST }),
    },
    JwtTokenService,
    { provide: USERS_REPOSITORY, useValue: utilisateurs },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ];
}

export function signerLesIdentitesDeTest(app: INestApplication): void {
  app.use((requete: Request, _reponse: Response, suite: NextFunction) => {
    const identite = requete.headers[EN_TETE_IDENTITE];
    if (typeof identite === 'string') {
      const [sub, ...roles] = identite.split(':');
      requete.headers.authorization = `Bearer ${jetonSigne(sub, roles)}`;
    }
    suite();
  });
}
