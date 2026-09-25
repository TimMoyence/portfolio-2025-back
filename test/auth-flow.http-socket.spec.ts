import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import type { User } from '../src/modules/users/domain/User';
import {
  authControllerProviders,
  createAuthUseCaseStubs,
} from './factories/core-api.factory';
import { buildUser, buildAuthResult } from './factories/user.factory';
import {
  applicationDeLaSuite,
  bootstrapTestAppAvecCookies,
  httpServerOf,
} from './helpers/nest-test-app';

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const LOGIN_PASSWORD = 'StrongPassword123!';

describe('Auth flow complet — sans bypass de guard (e2e)', () => {
  const JWT_SECRET = 'test-secret-for-e2e-auth-flow-32-chars!';
  const JWT_EXPIRES_IN = '900s';

  const jwtTokenService = new JwtTokenService(
    new ConfigService({ JWT_SECRET, JWT_EXPIRES_IN }),
  );

  const authStubs = createAuthUseCaseStubs();
  const {
    authenticateUserUseCase,
    refreshTokensUseCase,
    revokeTokenUseCase,
    getCurrentUserUseCase,
  } = authStubs;

  const app = applicationDeLaSuite(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        ...authControllerProviders(authStubs, {
          findById: jest
            .fn()
            .mockResolvedValue(buildUser({ emailVerified: true })),
        }),
        { provide: JwtTokenService, useValue: jwtTokenService },
        Reflector,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    return bootstrapTestAppAvecCookies(moduleRef);
  });

  const getHttpServer = () => httpServerOf(app());

  const signerPour = (user: User) =>
    jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

  const sessionSigneePour = async (user: User, refreshToken: string) => {
    const signed = await signerPour(user);
    return buildAuthResult({
      accessToken: signed.token,
      expiresIn: signed.expiresIn,
      refreshToken,
      user,
    });
  };

  const seConnecter = () =>
    request(getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: LOGIN_PASSWORD })
      .expect(201);

  const rafraichirAvec = (refreshToken: string) =>
    request(getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshToken}`)
      .expect(200);

  const seDeconnecterAvec = (refreshToken: string) =>
    request(getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `refresh_token=${refreshToken}`)
      .expect(200);

  const consulterMonProfil = (accessToken: string) =>
    request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

  function extractRefreshCookie(res: request.Response): string | undefined {
    const cookies = res.headers['set-cookie'] as unknown as
      | string[]
      | undefined;
    if (!cookies) return undefined;
    const match = (Array.isArray(cookies) ? cookies : [cookies]).find((c) =>
      c.startsWith('refresh_token='),
    );
    if (!match) return undefined;
    return match.split(';')[0].split('=').slice(1).join('=');
  }

  function attendreSessionEmise(
    res: request.Response,
    refreshTokenAttendu: string,
  ): { accessToken: string; refreshToken: string } {
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('user');
    expect(extractRefreshCookie(res)).toBe(refreshTokenAttendu);
    return {
      accessToken: res.body.accessToken as string,
      refreshToken: refreshTokenAttendu,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/login retourne un token JWT valide et le profil', async () => {
    authenticateUserUseCase.execute.mockResolvedValue(
      await sessionSigneePour(
        buildUser({ roles: ['teacher'] }),
        'opaque-refresh-token',
      ),
    );

    const res = await seConnecter();

    attendreSessionEmise(res, 'opaque-refresh-token');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).toHaveProperty('roles');
  });

  it('GET /api/auth/me avec Bearer valide retourne le profil utilisateur', async () => {
    const user = buildUser({ roles: ['teacher'] });
    const signed = await signerPour(user);

    getCurrentUserUseCase.execute.mockResolvedValue(user);

    const res = await consulterMonProfil(signed.token).expect(200);

    expect(res.body).toHaveProperty('id', user.id);
    expect(res.body).toHaveProperty('email', user.email);
    expect(res.body).toHaveProperty('firstName', user.firstName);
    expect(res.body).toHaveProperty('roles');
  });

  it('GET /api/auth/me sans header Authorization retourne 401', async () => {
    const res = await request(getHttpServer()).get('/api/auth/me').expect(401);

    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/auth/me avec un token bidon retourne 401', async () => {
    const res = await consulterMonProfil(
      'token-bidon-totalement-invalide',
    ).expect(401);

    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/auth/me avec un Bearer signe par un autre secret retourne 401', async () => {
    const otherConfigService = new ConfigService({
      JWT_SECRET: 'un-autre-secret-totalement-different!',
      JWT_EXPIRES_IN: '900s',
    });
    const otherJwtService = new JwtTokenService(otherConfigService);
    const otherSigned = await otherJwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
      roles: [],
    });

    const res = await consulterMonProfil(otherSigned.token).expect(401);

    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/auth/refresh retourne un nouveau couple de tokens', async () => {
    refreshTokensUseCase.execute.mockResolvedValue(
      await sessionSigneePour(
        buildUser({ roles: ['teacher'] }),
        'nouveau-refresh-token',
      ),
    );

    const res = await rafraichirAvec('opaque-refresh-token');

    attendreSessionEmise(res, 'nouveau-refresh-token');
  });

  it('POST /api/auth/refresh rejette sans cookie refresh_token (401)', async () => {
    await request(getHttpServer()).post('/api/auth/refresh').expect(401);
  });

  it('POST /api/auth/logout revoque le token et retourne 200', async () => {
    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    const res = await seDeconnecterAvec('opaque-refresh-token');

    expect(res.body).toHaveProperty('message');
    expect(revokeTokenUseCase.execute).toHaveBeenCalledWith(
      'opaque-refresh-token',
    );
  });

  it('POST /api/auth/logout sans cookie retourne 200 (graceful)', async () => {
    const res = await request(getHttpServer())
      .post('/api/auth/logout')
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(revokeTokenUseCase.execute).not.toHaveBeenCalled();
  });

  it('flow complet : login, acces protege, refresh, re-acces, logout', async () => {
    const user = buildUser({ roles: ['teacher'] });
    getCurrentUserUseCase.execute.mockResolvedValue(user);
    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    authenticateUserUseCase.execute.mockResolvedValue(
      await sessionSigneePour(user, 'refresh-v1'),
    );
    const premiere = attendreSessionEmise(await seConnecter(), 'refresh-v1');
    await consulterMonProfil(premiere.accessToken).expect(200);

    refreshTokensUseCase.execute.mockResolvedValue(
      await sessionSigneePour(user, 'refresh-v2'),
    );
    const seconde = attendreSessionEmise(
      await rafraichirAvec(premiere.refreshToken),
      'refresh-v2',
    );
    await consulterMonProfil(seconde.accessToken).expect(200);

    await seDeconnecterAvec(seconde.refreshToken);
  });
});
