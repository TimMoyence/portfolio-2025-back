import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import type { ChangePasswordCommand } from '../src/modules/users/application/dto/ChangePassword.command';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { InvalidCredentialsError } from '../src/common/domain/errors/InvalidCredentialsError';
import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import type { User } from '../src/modules/users/domain/User';
import {
  authControllerProviders,
  createAuthUseCaseStubs,
} from './factories/core-api.factory';
import { buildConfigService, TEST_JWT_SECRET } from './factories/env.factory';
import { createMockRefreshTokensRepo } from './factories/refresh-token.factory';
import {
  buildUser,
  buildAuthResult,
  createMockPasswordService,
  createMockUsersRepo,
} from './factories/user.factory';
import { sousEnvironnement } from './helpers/environnement';
import {
  applicationDeLaSuite,
  bootstrapTestAppAvecCookies,
  serveurHttpDe,
} from './helpers/nest-test-app';

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- fixture de test, pas un secret reel
const LOGIN_PASSWORD = 'StrongPassword123!';
const NOUVEAU_MOT_DE_PASSE = 'NouveauMotDePasse456!';

describe('Auth flow complet — sans bypass de guard (e2e)', () => {
  const JWT_EXPIRES_IN = 900;

  const jwtTokenService = new JwtTokenService(
    buildConfigService({ JWT_SECRET: TEST_JWT_SECRET, JWT_EXPIRES_IN }),
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

  const getHttpServer = () => serveurHttpDe(app());

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
      .expect(200);

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

  const attendreJetonDAccesRefuse = async (accessToken: string) => {
    const res = await consulterMonProfil(accessToken).expect(401);

    expect(res.body).toMatchObject({
      status: 401,
      detail: 'Invalid or expired token',
    });
  };

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

  it('POST /api/auth/login pose le cookie de rafraichissement sous le prefixe de l API', async () => {
    authenticateUserUseCase.execute.mockResolvedValue(
      await sessionSigneePour(buildUser(), 'opaque-refresh-token'),
    );

    const res = await sousEnvironnement({ API_PREFIX: 'api' }, async () =>
      seConnecter(),
    );

    expect(res.headers['set-cookie']).toEqual([
      expect.stringContaining('; Path=/api/auth;'),
    ]);
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

    expect(res.body).toMatchObject({
      status: 401,
      detail: 'Missing or invalid authorization header',
    });
  });

  it('GET /api/auth/me avec un token bidon retourne 401', async () => {
    await attendreJetonDAccesRefuse('token-bidon-totalement-invalide');
  });

  it('GET /api/auth/me avec un Bearer signe par un autre secret retourne 401', async () => {
    const otherConfigService = buildConfigService({
      JWT_SECRET: 'un-autre-secret-totalement-different!',
      JWT_EXPIRES_IN,
    });
    const otherJwtService = new JwtTokenService(otherConfigService);
    const otherSigned = await otherJwtService.sign({
      sub: 'user-1',
      email: 'test@example.com',
      roles: [],
    });

    await attendreJetonDAccesRefuse(otherSigned.token);
  });

  describe('defi Bearer du jeton de session (RFC 6750)', () => {
    it('marque du defi Bearer chaque 401 de la garde, seul refus que le front renouvelle', async () => {
      const sansJeton = await request(getHttpServer())
        .get('/api/auth/me')
        .expect(401);
      const jetonRefuse = await consulterMonProfil('token-bidon').expect(401);

      expect([
        sansJeton.headers['www-authenticate'],
        jetonRefuse.headers['www-authenticate'],
      ]).toEqual(['Bearer', 'Bearer error="invalid_token"']);
    });

    it('laisse sans defi un 401 qui juge des identifiants et non le jeton', async () => {
      authenticateUserUseCase.execute.mockRejectedValue(
        new InvalidCredentialsError('Invalid credentials'),
      );
      const reponses = await Promise.all([
        request(getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: LOGIN_PASSWORD }),
        request(getHttpServer()).post('/api/auth/refresh'),
      ]);

      expect(
        reponses.map((reponse) => [
          reponse.status,
          reponse.headers['www-authenticate'],
        ]),
      ).toEqual([
        [401, undefined],
        [401, undefined],
      ]);
    });
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

  describe('PATCH /api/auth/change-password', () => {
    const changerLeMotDePasse = async (
      compte: User,
      motDePasseActuelReconnu: boolean,
    ) => {
      const comptes = createMockUsersRepo();
      comptes.findById.mockResolvedValue(compte);
      const motsDePasse = createMockPasswordService();
      motsDePasse.verify.mockResolvedValue(motDePasseActuelReconnu);
      const casDUsage = new ChangePasswordUseCase(
        comptes,
        motsDePasse,
        createMockRefreshTokensRepo(),
      );
      authStubs.changePasswordUseCase.execute.mockImplementation(
        (commande: ChangePasswordCommand) => casDUsage.execute(commande),
      );
      const { token } = await signerPour(compte);

      return request(getHttpServer())
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: LOGIN_PASSWORD,
          newPassword: NOUVEAU_MOT_DE_PASSE,
        });
    };

    it('rend 400, et non le 401 qui ferme la session, a un mot de passe actuel faux', async () => {
      const res = await changerLeMotDePasse(
        buildUser({ passwordHash: 'empreinte' }),
        false,
      );

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 400,
        detail: 'Current password is invalid',
      });
    });

    it('rend 409, et non 401, a un compte qui n a pas encore de mot de passe', async () => {
      const res = await changerLeMotDePasse(
        buildUser({ passwordHash: null }),
        true,
      );

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ status: 409 });
    });
  });

  describe('GET /api/auth/verify-email', () => {
    const JETON_EMIS = 'a'.repeat(64);

    it('transmet au cas d usage un jeton de la forme emise', async () => {
      authStubs.verifyEmailUseCase.execute.mockResolvedValue({
        message: 'Adresse email verifiee avec succes.',
      });

      await request(getHttpServer())
        .get(`/api/auth/verify-email?token=${JETON_EMIS}`)
        .expect(200);

      expect(authStubs.verifyEmailUseCase.execute).toHaveBeenCalledWith(
        JETON_EMIS,
      );
    });
  });

  describe('routes du compte lues par le front', () => {
    const titulaire = buildUser({
      roles: ['teacher'],
      phone: '0601020304',
      updatedOrCreatedBy: 'self-service',
    });
    const enTantQueTitulaire = async () =>
      `Bearer ${(await signerPour(titulaire)).token}`;

    it('POST /api/auth/register relaie la reponse unique de l inscription', async () => {
      const reponse = { message: 'Inscription reussie.' };
      authStubs.createUsersUseCase.inscrire.mockResolvedValue(reponse);
      const candidat = {
        email: titulaire.email,
        password: LOGIN_PASSWORD,
        firstName: titulaire.firstName,
        lastName: titulaire.lastName,
      };

      const res = await request(getHttpServer())
        .post('/api/auth/register')
        .send(candidat)
        .expect(200);

      expect(res.body).toEqual(reponse);
      expect(authStubs.createUsersUseCase.inscrire).toHaveBeenCalledWith(
        candidat,
      );
    });

    it.each([
      ['roles', ['admin']],
      ['isActive', false],
    ])(
      'POST /api/auth/register refuse en 400 le champ %s, que seul un admin fixe',
      async (champ, valeur) => {
        await request(getHttpServer())
          .post('/api/auth/register')
          .send({
            email: titulaire.email,
            password: LOGIN_PASSWORD,
            firstName: titulaire.firstName,
            lastName: titulaire.lastName,
            [champ]: valeur,
          })
          .expect(400);

        expect(authStubs.createUsersUseCase.inscrire).not.toHaveBeenCalled();
      },
    );

    it('POST /api/auth/google ouvre une session', async () => {
      authStubs.authenticateGoogleUserUseCase.execute.mockResolvedValue(
        await sessionSigneePour(titulaire, 'google-refresh-token'),
      );

      const res = await request(getHttpServer())
        .post('/api/auth/google')
        .send({ idToken: 'jeton-google' })
        .expect(200);

      attendreSessionEmise(res, 'google-refresh-token');
    });

    it('POST /api/auth/reset-password confirme la reinitialisation', async () => {
      authStubs.resetPasswordUseCase.execute.mockResolvedValue({
        message: 'Mot de passe reinitialise avec succes.',
      });

      const res = await request(getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'b'.repeat(64), newPassword: NOUVEAU_MOT_DE_PASSE })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('POST /api/auth/resend-verification repond sans dire si le compte existe', async () => {
      authStubs.resendVerificationEmailUseCase.execute.mockResolvedValue({
        message: 'Si un compte existe, un email a ete envoye.',
      });

      const res = await request(getHttpServer())
        .post('/api/auth/resend-verification')
        .send({ email: titulaire.email })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it.each([
      [
        'post',
        '/api/auth/set-password',
        { newPassword: NOUVEAU_MOT_DE_PASSE },
        authStubs.setPasswordUseCase,
      ],
      [
        'patch',
        '/api/auth/change-password',
        { currentPassword: LOGIN_PASSWORD, newPassword: NOUVEAU_MOT_DE_PASSE },
        authStubs.changePasswordUseCase,
      ],
      [
        'patch',
        '/api/auth/profile',
        { firstName: 'Jeanne', phone: '0601020304' },
        authStubs.updateProfileUseCase,
      ],
    ] as const)(
      '%s %s rend le compte modifie',
      async (methode, chemin, corps, casDUsage) => {
        casDUsage.execute.mockResolvedValue(titulaire);

        const res = await request(getHttpServer())
          [methode](chemin)
          .set('Authorization', await enTantQueTitulaire())
          .send(corps)
          .expect(200);

        expect(res.body).toHaveProperty('id', titulaire.id);
      },
    );
  });
});
