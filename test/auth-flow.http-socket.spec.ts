import { INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import {
  authControllerProviders,
  createAuthUseCaseStubs,
} from './factories/core-api.factory';
import { buildUser, buildAuthResult } from './factories/user.factory';
import {
  bootstrapTestApp,
  fermerApplication,
  httpServerOf,
} from './helpers/nest-test-app';

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const LOGIN_PASSWORD = 'StrongPassword123!';

describe('Auth flow complet — sans bypass de guard (e2e)', () => {
  let app: INestApplication;
  let jwtTokenService: JwtTokenService;

  const JWT_SECRET = 'test-secret-for-e2e-auth-flow-32-chars!';
  const JWT_EXPIRES_IN = '900s';

  const authStubs = createAuthUseCaseStubs();
  const {
    authenticateUserUseCase,
    refreshTokensUseCase,
    revokeTokenUseCase,
    getCurrentUserUseCase,
  } = authStubs;

  const getHttpServer = () => httpServerOf(app);

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

  beforeAll(async () => {
    const configService = new ConfigService({
      JWT_SECRET,
      JWT_EXPIRES_IN,
    });

    const realJwtTokenService = new JwtTokenService(configService);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        ...authControllerProviders(authStubs, {
          findById: jest
            .fn()
            .mockResolvedValue(buildUser({ emailVerified: true })),
        }),
        { provide: JwtTokenService, useValue: realJwtTokenService },
        Reflector,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    jwtTokenService = realJwtTokenService;

    app = await bootstrapTestApp(moduleRef, (nestApp) => {
      nestApp.use(cookieParser());
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await fermerApplication(app);
  });

  it('POST /api/auth/login retourne un token JWT valide et le profil', async () => {
    const user = buildUser({ roles: ['weather'] });
    const signed = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    authenticateUserUseCase.execute.mockResolvedValue(
      buildAuthResult({
        accessToken: signed.token,
        expiresIn: signed.expiresIn,
        refreshToken: 'opaque-refresh-token',
        user,
      }),
    );

    const res = await request(getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: LOGIN_PASSWORD })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).toHaveProperty('roles');

    const refreshCookie = extractRefreshCookie(res);
    expect(refreshCookie).toBe('opaque-refresh-token');
  });

  it('GET /api/auth/me avec Bearer valide retourne le profil utilisateur', async () => {
    const user = buildUser({ roles: ['weather'] });
    const signed = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    getCurrentUserUseCase.execute.mockResolvedValue(user);

    const res = await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signed.token}`)
      .expect(200);

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
    const res = await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-bidon-totalement-invalide')
      .expect(401);

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

    const res = await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${otherSigned.token}`)
      .expect(401);

    expect(res.body).toHaveProperty('message');
  });

  it('POST /api/auth/refresh retourne un nouveau couple de tokens', async () => {
    const user = buildUser({ roles: ['weather'] });
    const newSigned = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    refreshTokensUseCase.execute.mockResolvedValue(
      buildAuthResult({
        accessToken: newSigned.token,
        expiresIn: newSigned.expiresIn,
        refreshToken: 'nouveau-refresh-token',
        user,
      }),
    );

    const res = await request(getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=opaque-refresh-token')
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('user');

    const refreshCookie = extractRefreshCookie(res);
    expect(refreshCookie).toBe('nouveau-refresh-token');
  });

  it('POST /api/auth/refresh rejette sans cookie refresh_token (401)', async () => {
    await request(getHttpServer()).post('/api/auth/refresh').expect(401);
  });

  it('POST /api/auth/logout revoque le token et retourne 200', async () => {
    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    const res = await request(getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', 'refresh_token=opaque-refresh-token')
      .expect(200);

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
    const user = buildUser({ roles: ['weather'] });

    const firstSigned = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    authenticateUserUseCase.execute.mockResolvedValue(
      buildAuthResult({
        accessToken: firstSigned.token,
        expiresIn: firstSigned.expiresIn,
        refreshToken: 'refresh-v1',
        user,
      }),
    );

    const loginRes = await request(getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: LOGIN_PASSWORD })
      .expect(201);

    const firstToken = loginRes.body.accessToken as string;
    const firstRefreshCookie = extractRefreshCookie(loginRes);
    expect(firstRefreshCookie).toBe('refresh-v1');

    getCurrentUserUseCase.execute.mockResolvedValue(user);

    await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);

    const secondSigned = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
    refreshTokensUseCase.execute.mockResolvedValue(
      buildAuthResult({
        accessToken: secondSigned.token,
        expiresIn: secondSigned.expiresIn,
        refreshToken: 'refresh-v2',
        user,
      }),
    );

    const refreshRes = await request(getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${firstRefreshCookie!}`)
      .expect(200);

    const secondToken = refreshRes.body.accessToken as string;
    const secondRefreshCookie = extractRefreshCookie(refreshRes);
    expect(secondRefreshCookie).toBe('refresh-v2');

    await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);

    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    await request(getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `refresh_token=${secondRefreshCookie!}`)
      .expect(200);
  });
});
