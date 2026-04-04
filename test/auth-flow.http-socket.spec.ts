import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { SetPasswordUseCase } from '../src/modules/users/application/SetPassword.useCase';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';
import { buildUser, buildAuthResult } from './factories/user.factory';

/**
 * Tests E2E du flow d'authentification SANS bypass de guard.
 * Utilise le vrai JwtTokenService pour signer/verifier les tokens,
 * et le vrai JwtAuthGuard pour proteger les routes.
 */
describe('Auth flow complet — sans bypass de guard (e2e)', () => {
  let app: INestApplication;
  let jwtTokenService: JwtTokenService;

  const JWT_SECRET = 'test-secret-for-e2e-auth-flow-32-chars!';
  const JWT_EXPIRES_IN = '900s';

  /* Mocks des use cases */
  const authenticateUserUseCase = { execute: jest.fn() };
  const authenticateGoogleUserUseCase = { execute: jest.fn() };
  const createUsersUseCase = { execute: jest.fn() };
  const changePasswordUseCase = { execute: jest.fn() };
  const refreshTokensUseCase = { execute: jest.fn() };
  const revokeTokenUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const setPasswordUseCase = { execute: jest.fn() };
  const usersRepository = { findById: jest.fn() };

  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const configService = new ConfigService({
      JWT_SECRET,
      JWT_EXPIRES_IN,
    });

    const realJwtTokenService = new JwtTokenService(configService);

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthenticateUserUseCase,
          useValue: authenticateUserUseCase,
        },
        {
          provide: AuthenticateGoogleUserUseCase,
          useValue: authenticateGoogleUserUseCase,
        },
        { provide: CreateUsersUseCase, useValue: createUsersUseCase },
        { provide: ChangePasswordUseCase, useValue: changePasswordUseCase },
        { provide: RefreshTokensUseCase, useValue: refreshTokensUseCase },
        { provide: RevokeTokenUseCase, useValue: revokeTokenUseCase },
        {
          provide: RequestPasswordResetUseCase,
          useValue: requestPasswordResetUseCase,
        },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: SetPasswordUseCase, useValue: setPasswordUseCase },
        { provide: USERS_REPOSITORY, useValue: usersRepository },
        { provide: JwtTokenService, useValue: realJwtTokenService },
        Reflector,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    jwtTokenService = realJwtTokenService;

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  /* =================================================================
   *  1. Login → retourne accessToken, refreshToken, expiresIn, user
   * ================================================================= */

  it('POST /api/auth/login retourne un token JWT valide et le profil', async () => {
    const user = buildUser({ roles: ['budget', 'weather'] });
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
      .send({ email: 'test@example.com', password: 'StrongPassword123!' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken', 'opaque-refresh-token');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'test@example.com');
    expect(res.body.user).toHaveProperty('roles');
  });

  /* =================================================================
   *  2. Appel protege AVEC JWT valide → 200
   * ================================================================= */

  it('GET /api/auth/me avec Bearer valide retourne le profil utilisateur', async () => {
    const user = buildUser({ roles: ['budget'] });
    const signed = await jwtTokenService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    usersRepository.findById.mockResolvedValue(user);

    const res = await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signed.token}`)
      .expect(200);

    expect(res.body).toHaveProperty('id', user.id);
    expect(res.body).toHaveProperty('email', user.email);
    expect(res.body).toHaveProperty('firstName', user.firstName);
    expect(res.body).toHaveProperty('roles');
  });

  /* =================================================================
   *  3. Appel protege SANS JWT → 401
   * ================================================================= */

  it('GET /api/auth/me sans header Authorization retourne 401', async () => {
    const res = await request(getHttpServer()).get('/api/auth/me').expect(401);

    expect(res.body).toHaveProperty('message');
  });

  /* =================================================================
   *  4. Appel protege avec JWT invalide → 401
   * ================================================================= */

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

    await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${otherSigned.token}`)
      .expect(401);
  });

  /* =================================================================
   *  5. Refresh → nouveau couple de tokens
   * ================================================================= */

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
      .send({ refreshToken: 'opaque-refresh-token' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken', 'nouveau-refresh-token');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('user');
  });

  it('POST /api/auth/refresh rejette sans refreshToken (400)', async () => {
    await request(getHttpServer())
      .post('/api/auth/refresh')
      .send({})
      .expect(400);
  });

  /* =================================================================
   *  6. Logout → 200
   * ================================================================= */

  it('POST /api/auth/logout revoque le token et retourne 200', async () => {
    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    const res = await request(getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken: 'opaque-refresh-token' })
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(revokeTokenUseCase.execute).toHaveBeenCalledWith(
      'opaque-refresh-token',
    );
  });

  it('POST /api/auth/logout rejette sans refreshToken (400)', async () => {
    await request(getHttpServer())
      .post('/api/auth/logout')
      .send({})
      .expect(400);
  });

  /* =================================================================
   *  Flow complet : login → me → refresh → me → logout
   * ================================================================= */

  it('flow complet : login, acces protege, refresh, re-acces, logout', async () => {
    const user = buildUser({ roles: ['budget', 'weather'] });

    /* 1. Login */
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
      .send({ email: 'test@example.com', password: 'StrongPassword123!' })
      .expect(201);

    const firstToken = loginRes.body.accessToken as string;

    /* 2. Acces protege avec le premier token */
    usersRepository.findById.mockResolvedValue(user);

    await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${firstToken}`)
      .expect(200);

    /* 3. Refresh */
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
      .send({ refreshToken: 'refresh-v1' })
      .expect(200);

    const secondToken = refreshRes.body.accessToken as string;

    /* 4. Acces protege avec le nouveau token */
    await request(getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(200);

    /* 5. Logout */
    revokeTokenUseCase.execute.mockResolvedValue(undefined);

    await request(getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken: 'refresh-v2' })
      .expect(200);
  });
});
