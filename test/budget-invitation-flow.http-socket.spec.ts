import { createHash } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AuthController } from '../src/modules/users/interfaces/Auth.controller';
import { AuthAuditLogger } from '../src/modules/users/application/services/AuthAuditLogger';
import { AuthenticateGoogleUserUseCase } from '../src/modules/users/application/AuthenticateGoogleUser.useCase';
import { AuthenticateUserUseCase } from '../src/modules/users/application/AuthenticateUser.useCase';
import { ChangePasswordUseCase } from '../src/modules/users/application/ChangePassword.useCase';
import { CreateUsersUseCase } from '../src/modules/users/application/CreateUsers.useCase';
import { GetCurrentUserUseCase } from '../src/modules/users/application/GetCurrentUser.useCase';
import { JwtTokenService } from '../src/modules/users/application/services/JwtTokenService';
import { RefreshTokensUseCase } from '../src/modules/users/application/RefreshTokens.useCase';
import { RequestPasswordResetUseCase } from '../src/modules/users/application/RequestPasswordReset.useCase';
import { ResendVerificationEmailUseCase } from '../src/modules/users/application/ResendVerificationEmail.useCase';
import { ResetPasswordUseCase } from '../src/modules/users/application/ResetPassword.useCase';
import { RevokeTokenUseCase } from '../src/modules/users/application/RevokeToken.useCase';
import { SetPasswordUseCase } from '../src/modules/users/application/SetPassword.useCase';
import { UpdateProfileUseCase } from '../src/modules/users/application/UpdateProfile.useCase';
import { VerifyEmailUseCase } from '../src/modules/users/application/VerifyEmail.useCase';

import { BudgetController } from '../src/modules/budget/interfaces/Budget.controller';
import { AcceptBudgetInvitationUseCase } from '../src/modules/budget/application/services/AcceptBudgetInvitation.useCase';
import { CreateBudgetCategoryUseCase } from '../src/modules/budget/application/services/CreateBudgetCategory.useCase';
import { CreateBudgetEntryUseCase } from '../src/modules/budget/application/services/CreateBudgetEntry.useCase';
import { CreateBudgetGroupUseCase } from '../src/modules/budget/application/services/CreateBudgetGroup.useCase';
import { DeleteBudgetEntryUseCase } from '../src/modules/budget/application/services/DeleteBudgetEntry.useCase';
import { GetBudgetCategoriesUseCase } from '../src/modules/budget/application/services/GetBudgetCategories.useCase';
import { GetBudgetEntriesMonthsUseCase } from '../src/modules/budget/application/services/GetBudgetEntriesMonths.useCase';
import { GetBudgetEntriesUseCase } from '../src/modules/budget/application/services/GetBudgetEntries.useCase';
import { GetBudgetGroupMembersUseCase } from '../src/modules/budget/application/services/GetBudgetGroupMembers.useCase';
import { GetBudgetGroupsUseCase } from '../src/modules/budget/application/services/GetBudgetGroups.useCase';
import { GetBudgetSummaryUseCase } from '../src/modules/budget/application/services/GetBudgetSummary.useCase';
import { ImportBudgetEntriesUseCase } from '../src/modules/budget/application/services/ImportBudgetEntries.useCase';
import { ListPendingInvitationsUseCase } from '../src/modules/budget/application/services/ListPendingInvitations.useCase';
import { RemoveBudgetGroupMemberUseCase } from '../src/modules/budget/application/services/RemoveBudgetGroupMember.useCase';
import { ShareBudgetUseCase } from '../src/modules/budget/application/services/ShareBudget.useCase';
import { UpdateBudgetCategoryUseCase } from '../src/modules/budget/application/services/UpdateBudgetCategory.useCase';
import { UpdateBudgetEntryUseCase } from '../src/modules/budget/application/services/UpdateBudgetEntry.useCase';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
} from '../src/modules/budget/domain/token';

import { JwtAuthGuard } from '../src/common/interfaces/auth/jwt-auth.guard';
import { RolesGuard } from '../src/common/interfaces/auth/roles.guard';
import { DomainExceptionFilter } from '../src/common/interfaces/filters/DomainExceptionFilter';
import {
  InvalidInvitationTokenError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
} from '../src/modules/budget/domain/errors/InvitationErrors';
import { RateLimitExceededError } from '../src/common/domain/errors/RateLimitExceededError';
import { USERS_REPOSITORY } from '../src/modules/users/domain/token';
import { buildUser } from './factories/user.factory';
import {
  buildBudgetGroup,
  buildBudgetInvitation,
} from './factories/budget.factory';

/**
 * Tests E2E HTTP du flow complet d'invitation budget magic-link.
 *
 * Couverture : POST /budget/share -> creation invitation -> preview public
 * par token -> register avec auto-accept -> accept manuel post-login.
 *
 * Les use cases sont mockes (zero DB), les repos consultes directement par
 * AuthController (preview) le sont aussi. Le JwtAuthGuard est reel pour
 * verifier la chaine d'authentification, RolesGuard est bypasse (la verif
 * du role 'budget' n'est pas l'objet de ce test).
 *
 * Tokens utilises : la valeur clear est connue (le mock de invitationRepo
 * retourne une invitation dont le tokenHash correspond).
 */
describe('Budget invitation magic-link — flow e2e HTTP', () => {
  let app: INestApplication;
  let jwtTokenService: JwtTokenService;

  const JWT_SECRET = 'test-secret-for-budget-invitation-flow-32!';
  const JWT_EXPIRES_IN = '900s';

  const OWNER_ID = '00000000-0000-4000-a000-000000000010';
  const OWNER_EMAIL = 'owner@example.com';
  const NEW_USER_ID = '00000000-0000-4000-a000-000000000011';
  const NEW_USER_EMAIL = 'newuser@example.com';
  const EXISTING_USER_ID = '00000000-0000-4000-a000-000000000012';
  const EXISTING_USER_EMAIL = 'existing@example.com';
  const EVE_ID = '00000000-0000-4000-a000-000000000013';
  const EVE_EMAIL = 'eve@example.com';
  const GROUP_UUID = '00000000-0000-4000-a000-000000000001';

  const KNOWN_TOKEN_CLEAR = 'magic-token-known-clear-value-abcdef1234';
  const KNOWN_TOKEN_HASH = createHash('sha256')
    .update(KNOWN_TOKEN_CLEAR)
    .digest('hex');

  /* ---------- Mocks AuthController use cases ---------- */
  const authenticateUserUseCase = { execute: jest.fn() };
  const authenticateGoogleUserUseCase = { execute: jest.fn() };
  const createUsersUseCase = { execute: jest.fn() };
  const changePasswordUseCase = { execute: jest.fn() };
  const refreshTokensUseCase = { execute: jest.fn() };
  const revokeTokenUseCase = { execute: jest.fn() };
  const requestPasswordResetUseCase = { execute: jest.fn() };
  const resetPasswordUseCase = { execute: jest.fn() };
  const setPasswordUseCase = { execute: jest.fn() };
  const updateProfileUseCase = { execute: jest.fn() };
  const getCurrentUserUseCase = { execute: jest.fn() };
  const verifyEmailUseCase = { execute: jest.fn() };
  const resendVerificationEmailUseCase = { execute: jest.fn() };
  const acceptBudgetInvitationUseCase = { execute: jest.fn() };

  /* ---------- Mocks BudgetController use cases ---------- */
  const createBudgetGroupUseCase = { execute: jest.fn() };
  const getBudgetGroupsUseCase = { execute: jest.fn() };
  const createBudgetEntryUseCase = { execute: jest.fn() };
  const getBudgetEntriesUseCase = { execute: jest.fn() };
  const getBudgetSummaryUseCase = { execute: jest.fn() };
  const importBudgetEntriesUseCase = { execute: jest.fn() };
  const updateBudgetEntryUseCase = { execute: jest.fn() };
  const createBudgetCategoryUseCase = { execute: jest.fn() };
  const getBudgetCategoriesUseCase = { execute: jest.fn() };
  const shareBudgetUseCase = { execute: jest.fn() };
  const deleteBudgetEntryUseCase = { execute: jest.fn() };
  const updateBudgetCategoryUseCase = { execute: jest.fn() };
  const getBudgetGroupMembersUseCase = { execute: jest.fn() };
  const removeBudgetGroupMemberUseCase = { execute: jest.fn() };
  const getBudgetEntriesMonthsUseCase = { execute: jest.fn() };
  const listPendingInvitationsUseCase = { execute: jest.fn() };

  /* ---------- Mocks repos consultes par AuthController preview ---------- */
  const usersRepo = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    findByGoogleId: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
  };

  const budgetInvitationRepo = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    findActiveByGroupAndEmail: jest.fn(),
    findPendingByGroup: jest.fn(),
    markAccepted: jest.fn(),
    markRevoked: jest.fn(),
  };

  const budgetGroupRepo = {
    findById: jest.fn(),
    create: jest.fn(),
    findByOwner: jest.fn(),
    findByMember: jest.fn(),
    isMember: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    listMembers: jest.fn(),
  };

  const getHttpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  /** Signe un JWT pour un user donne, et configure le findById pour qu'il
   *  retourne ce user (verifie par JwtAuthGuard). */
  async function signTokenForUser(
    userId: string,
    email: string,
    roles: string[] = ['budget'],
  ): Promise<string> {
    const signed = await jwtTokenService.sign({ sub: userId, email, roles });
    return signed.token;
  }

  beforeAll(async () => {
    const configService = new ConfigService({
      JWT_SECRET,
      JWT_EXPIRES_IN,
      CORS_ORIGIN: 'http://localhost:4200',
    });
    const realJwtTokenService = new JwtTokenService(configService);

    const moduleRef = await Test.createTestingModule({
      imports: [
        // Throttler limite tres haute pour les tests qui ne portent pas
        // sur le rate-limit. Pour le scenario E (rate-limit 5/24h sur
        // /budget/share), c'est le ShareBudgetUseCase mocke qui leve
        // RateLimitExceededError directement (le quota applicatif vit
        // dans le use case, pas dans le decorator @Throttle qui n'est
        // qu'une defense-in-depth HTTP).
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
      controllers: [AuthController, BudgetController],
      providers: [
        /* AuthController use cases mockes */
        { provide: AuthenticateUserUseCase, useValue: authenticateUserUseCase },
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
        { provide: UpdateProfileUseCase, useValue: updateProfileUseCase },
        { provide: GetCurrentUserUseCase, useValue: getCurrentUserUseCase },
        { provide: VerifyEmailUseCase, useValue: verifyEmailUseCase },
        {
          provide: ResendVerificationEmailUseCase,
          useValue: resendVerificationEmailUseCase,
        },
        AuthAuditLogger,
        {
          provide: AcceptBudgetInvitationUseCase,
          useValue: acceptBudgetInvitationUseCase,
        },

        /* BudgetController use cases mockes */
        {
          provide: CreateBudgetGroupUseCase,
          useValue: createBudgetGroupUseCase,
        },
        { provide: GetBudgetGroupsUseCase, useValue: getBudgetGroupsUseCase },
        {
          provide: CreateBudgetEntryUseCase,
          useValue: createBudgetEntryUseCase,
        },
        { provide: GetBudgetEntriesUseCase, useValue: getBudgetEntriesUseCase },
        { provide: GetBudgetSummaryUseCase, useValue: getBudgetSummaryUseCase },
        {
          provide: ImportBudgetEntriesUseCase,
          useValue: importBudgetEntriesUseCase,
        },
        {
          provide: UpdateBudgetEntryUseCase,
          useValue: updateBudgetEntryUseCase,
        },
        {
          provide: CreateBudgetCategoryUseCase,
          useValue: createBudgetCategoryUseCase,
        },
        {
          provide: GetBudgetCategoriesUseCase,
          useValue: getBudgetCategoriesUseCase,
        },
        { provide: ShareBudgetUseCase, useValue: shareBudgetUseCase },
        {
          provide: DeleteBudgetEntryUseCase,
          useValue: deleteBudgetEntryUseCase,
        },
        {
          provide: UpdateBudgetCategoryUseCase,
          useValue: updateBudgetCategoryUseCase,
        },
        {
          provide: GetBudgetGroupMembersUseCase,
          useValue: getBudgetGroupMembersUseCase,
        },
        {
          provide: RemoveBudgetGroupMemberUseCase,
          useValue: removeBudgetGroupMemberUseCase,
        },
        {
          provide: GetBudgetEntriesMonthsUseCase,
          useValue: getBudgetEntriesMonthsUseCase,
        },
        {
          provide: ListPendingInvitationsUseCase,
          useValue: listPendingInvitationsUseCase,
        },

        /* Repos consultes directement par AuthController */
        { provide: USERS_REPOSITORY, useValue: usersRepo },
        {
          provide: BUDGET_INVITATION_REPOSITORY,
          useValue: budgetInvitationRepo,
        },
        { provide: BUDGET_GROUP_REPOSITORY, useValue: budgetGroupRepo },

        /* JWT reel + JwtAuthGuard global */
        { provide: JwtTokenService, useValue: realJwtTokenService },
        Reflector,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    })
      // RolesGuard bypasse : la verif du role 'budget' est testee ailleurs.
      // Ici on s'interesse au flow JWT + use cases + mapping erreurs.
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    jwtTokenService = realJwtTokenService;

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    /* Par defaut, JwtAuthGuard.findById retourne un user emailVerified.
     * Les tests qui ont besoin d'un user particulier reconfigurent le
     * mock dans leur scope. */
    usersRepo.findById.mockImplementation((id: string) => {
      if (id === OWNER_ID) {
        return Promise.resolve(
          buildUser({
            id: OWNER_ID,
            email: OWNER_EMAIL,
            emailVerified: true,
            firstName: 'Alice',
          }),
        );
      }
      if (id === NEW_USER_ID) {
        return Promise.resolve(
          buildUser({
            id: NEW_USER_ID,
            email: NEW_USER_EMAIL,
            emailVerified: true,
          }),
        );
      }
      if (id === EXISTING_USER_ID) {
        return Promise.resolve(
          buildUser({
            id: EXISTING_USER_ID,
            email: EXISTING_USER_EMAIL,
            emailVerified: true,
          }),
        );
      }
      if (id === EVE_ID) {
        return Promise.resolve(
          buildUser({
            id: EVE_ID,
            email: EVE_EMAIL,
            emailVerified: true,
          }),
        );
      }
      return Promise.resolve(buildUser({ id, emailVerified: true }));
    });
  });

  afterAll(async () => {
    await app.close();
  });

  /* =================================================================
   * Scenario A : invitation -> register email -> auto-accept
   * ================================================================= */

  describe('Scenario A — invitation puis register avec auto-accept', () => {
    it('flow complet : POST /share invite, GET preview public, POST /register auto-join', async () => {
      /* 1. Owner appelle POST /share : ShareBudgetUseCase retourne
       *    'invited' (cible sans compte). */
      shareBudgetUseCase.execute.mockResolvedValueOnce({ status: 'invited' });

      const ownerToken = await signTokenForUser(OWNER_ID, OWNER_EMAIL, [
        'budget',
      ]);

      const shareRes = await request(getHttpServer())
        .post('/api/budget/share')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ groupId: GROUP_UUID, targetEmail: NEW_USER_EMAIL })
        .expect(201);

      expect(shareRes.body).toEqual({ status: 'invited' });
      expect(shareBudgetUseCase.execute).toHaveBeenCalledWith({
        userId: OWNER_ID,
        groupId: GROUP_UUID,
        targetEmail: NEW_USER_EMAIL,
      });

      /* 2. Le mail magic-link contient un token clair connu.
       *    Le frontend appelle GET /auth/invitations/by-token/:token
       *    avant le register pour afficher la preview. */
      const invitation = buildBudgetInvitation({
        targetEmail: NEW_USER_EMAIL,
        tokenHash: KNOWN_TOKEN_HASH,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      budgetInvitationRepo.findByTokenHash.mockResolvedValueOnce(invitation);
      // owner pour inviterFirstName, group pour groupName
      usersRepo.findById.mockImplementationOnce(() =>
        Promise.resolve(buildUser({ id: OWNER_ID, firstName: 'Alice' })),
      );
      budgetGroupRepo.findById.mockResolvedValueOnce(
        buildBudgetGroup({ id: GROUP_UUID, name: 'Budget couple' }),
      );

      const previewRes = await request(getHttpServer())
        .get(`/api/auth/invitations/by-token/${KNOWN_TOKEN_CLEAR}`)
        .expect(200);

      expect(previewRes.body).toEqual({
        inviterFirstName: 'Alice',
        groupName: 'Budget couple',
        targetEmail: NEW_USER_EMAIL,
        expiresAt: invitation.expiresAt.toISOString(),
      });
      expect(budgetInvitationRepo.findByTokenHash).toHaveBeenCalledWith(
        KNOWN_TOKEN_HASH,
      );

      /* 3. Le user complete le register avec le inviteToken.
       *    CreateUsersUseCase.execute est mocke pour retourner inviteWarning=null
       *    (auto-accept reussi). On verifie surtout que inviteToken est passe. */
      createUsersUseCase.execute.mockResolvedValueOnce({
        user: buildUser({
          id: NEW_USER_ID,
          email: NEW_USER_EMAIL,
          emailVerified: false,
        }),
        inviteWarning: null,
      });

      const registerRes = await request(getHttpServer())
        .post('/api/auth/register')
        .send({
          email: NEW_USER_EMAIL,
          password: 'StrongPassword123!',
          firstName: 'Bob',
          lastName: 'Martin',
          inviteToken: KNOWN_TOKEN_CLEAR,
        })
        .expect(201);

      expect(registerRes.body).toEqual({
        message: expect.stringContaining('Inscription reussie'),
      });
      expect(createUsersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: NEW_USER_EMAIL,
          inviteToken: KNOWN_TOKEN_CLEAR,
          roles: [],
          updatedOrCreatedBy: 'self-registration',
        }),
      );
    });

    it('register avec inviteToken invalide -> 201 + inviteWarning dans la reponse', async () => {
      // Auto-accept echoue avec un warning : le user est cree, l'API
      // retourne 201 + le warning pour que le front l'affiche.
      createUsersUseCase.execute.mockResolvedValueOnce({
        user: buildUser({
          id: NEW_USER_ID,
          email: NEW_USER_EMAIL,
          emailVerified: false,
        }),
        inviteWarning: {
          code: 'INVITATION_NOT_FOUND',
          message: 'Cette invitation est introuvable.',
        },
      });

      const res = await request(getHttpServer())
        .post('/api/auth/register')
        .send({
          email: NEW_USER_EMAIL,
          password: 'StrongPassword123!',
          firstName: 'Bob',
          lastName: 'Martin',
          inviteToken: 'token-invalide',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        message: expect.any(String),
        inviteWarning: {
          code: 'INVITATION_NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  /* =================================================================
   * Scenario B — invitation puis accept manuel post-login
   * ================================================================= */

  describe('Scenario B — invitation puis accept manuel apres login', () => {
    it('user existant logue accepte une invitation -> 200 { groupId, groupName }', async () => {
      acceptBudgetInvitationUseCase.execute.mockResolvedValueOnce({
        groupId: GROUP_UUID,
        groupName: 'Budget couple',
      });

      const userToken = await signTokenForUser(
        EXISTING_USER_ID,
        EXISTING_USER_EMAIL,
      );

      const res = await request(getHttpServer())
        .post(`/api/auth/invitations/${KNOWN_TOKEN_CLEAR}/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toEqual({
        groupId: GROUP_UUID,
        groupName: 'Budget couple',
      });
      expect(acceptBudgetInvitationUseCase.execute).toHaveBeenCalledWith({
        tokenClear: KNOWN_TOKEN_CLEAR,
        acceptedByUserId: EXISTING_USER_ID,
        acceptedByEmail: EXISTING_USER_EMAIL,
      });
    });

    it('accept sans Bearer token -> 401', async () => {
      await request(getHttpServer())
        .post(`/api/auth/invitations/${KNOWN_TOKEN_CLEAR}/accept`)
        .expect(401);
    });
  });

  /* =================================================================
   * Scenario C — token invalide / expire -> 404 anti-enumeration
   * ================================================================= */

  describe('Scenario C — preview public anti-enumeration', () => {
    it('GET preview avec token inconnu -> 404 sans distinction', async () => {
      budgetInvitationRepo.findByTokenHash.mockResolvedValueOnce(null);

      const res = await request(getHttpServer())
        .get('/api/auth/invitations/by-token/token-bidon-inconnu')
        .expect(404);

      // RFC 7807 Problem Details : title + detail (DomainExceptionFilter
      // n'est pas applique sur NotFoundException directe — c'est le filtre
      // par defaut Nest qui repond, format { statusCode, message }).
      expect(res.body).toMatchObject({
        message: expect.any(String),
      });
    });

    it('GET preview avec invitation expiree -> 404 (pas 410)', async () => {
      // Anti-enumeration : meme reponse que pour token inconnu, pour ne
      // pas reveler l'existence de l'invitation au scrapper.
      const expired = buildBudgetInvitation({
        targetEmail: NEW_USER_EMAIL,
        tokenHash: KNOWN_TOKEN_HASH,
        expiresAt: new Date(Date.now() - 1000),
        isPending: () => false,
        isExpired: () => true,
      });
      budgetInvitationRepo.findByTokenHash.mockResolvedValueOnce(expired);

      await request(getHttpServer())
        .get(`/api/auth/invitations/by-token/${KNOWN_TOKEN_CLEAR}`)
        .expect(404);
    });

    it('GET preview avec invitation revoquee -> 404 (pas 410)', async () => {
      const revoked = buildBudgetInvitation({
        targetEmail: NEW_USER_EMAIL,
        tokenHash: KNOWN_TOKEN_HASH,
        revokedAt: new Date(),
        isPending: () => false,
        isExpired: () => false,
      });
      budgetInvitationRepo.findByTokenHash.mockResolvedValueOnce(revoked);

      await request(getHttpServer())
        .get(`/api/auth/invitations/by-token/${KNOWN_TOKEN_CLEAR}`)
        .expect(404);
    });

    it('GET preview avec invitation valide mais inviter introuvable -> 404', async () => {
      const invitation = buildBudgetInvitation({
        tokenHash: KNOWN_TOKEN_HASH,
      });
      budgetInvitationRepo.findByTokenHash.mockResolvedValueOnce(invitation);
      // Le findById de l'inviter retourne null
      usersRepo.findById.mockImplementationOnce(() => Promise.resolve(null));
      budgetGroupRepo.findById.mockResolvedValueOnce(buildBudgetGroup());

      await request(getHttpServer())
        .get(`/api/auth/invitations/by-token/${KNOWN_TOKEN_CLEAR}`)
        .expect(404);
    });
  });

  /* =================================================================
   * Scenario D — accept avec email mismatch -> 403
   * ================================================================= */

  describe('Scenario D — accept avec email different', () => {
    it('token destine a bob, user logue Eve -> 403 (InvitationEmailMismatchError)', async () => {
      acceptBudgetInvitationUseCase.execute.mockRejectedValueOnce(
        new InvitationEmailMismatchError(NEW_USER_EMAIL, EVE_EMAIL),
      );

      const eveToken = await signTokenForUser(EVE_ID, EVE_EMAIL);

      const res = await request(getHttpServer())
        .post(`/api/auth/invitations/${KNOWN_TOKEN_CLEAR}/accept`)
        .set('Authorization', `Bearer ${eveToken}`)
        .expect(403);

      // DomainExceptionFilter mappe au format RFC 7807
      expect(res.body).toMatchObject({
        status: 403,
        code: 'INVITATION_EMAIL_MISMATCH',
      });
    });

    it('accept avec token invalide -> 404', async () => {
      acceptBudgetInvitationUseCase.execute.mockRejectedValueOnce(
        new InvalidInvitationTokenError(),
      );

      const userToken = await signTokenForUser(
        EXISTING_USER_ID,
        EXISTING_USER_EMAIL,
      );

      const res = await request(getHttpServer())
        .post(`/api/auth/invitations/token-bidon/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(res.body).toMatchObject({ code: 'INVITATION_NOT_FOUND' });
    });

    it('accept avec invitation expiree -> 410', async () => {
      acceptBudgetInvitationUseCase.execute.mockRejectedValueOnce(
        new InvitationExpiredError(),
      );

      const userToken = await signTokenForUser(
        EXISTING_USER_ID,
        EXISTING_USER_EMAIL,
      );

      const res = await request(getHttpServer())
        .post(`/api/auth/invitations/${KNOWN_TOKEN_CLEAR}/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(410);

      expect(res.body).toMatchObject({ code: 'INVITATION_EXPIRED' });
    });
  });

  /* =================================================================
   * Scenario E — quota applicatif 5/24h sur POST /share
   * =================================================================
   *
   * Le quota 5/24h vit dans ShareBudgetUseCase (via
   * IBudgetShareAttemptRepository) et n'est pas porte par le decorator
   * @Throttle (qui est une defense-in-depth HTTP). On verifie le mapping
   * RateLimitExceededError -> 429 + code stable.
   */

  describe('Scenario E — quota applicatif depasse', () => {
    it('6e POST /share -> 429 (RateLimitExceededError)', async () => {
      // 5 premiers passes
      for (let i = 0; i < 5; i++) {
        shareBudgetUseCase.execute.mockResolvedValueOnce({ status: 'invited' });
      }
      // Le 6e leve un RateLimitExceededError
      shareBudgetUseCase.execute.mockRejectedValueOnce(
        new RateLimitExceededError(
          "Quota d'invitations atteint (5 par 24h). Reessaie demain.",
        ),
      );

      const ownerToken = await signTokenForUser(OWNER_ID, OWNER_EMAIL, [
        'budget',
      ]);

      // 5 invitations OK
      for (let i = 0; i < 5; i++) {
        await request(getHttpServer())
          .post('/api/budget/share')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            groupId: GROUP_UUID,
            targetEmail: `invitee${i}@example.com`,
          })
          .expect(201);
      }

      // 6e invitation rejetee
      const res = await request(getHttpServer())
        .post('/api/budget/share')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          groupId: GROUP_UUID,
          targetEmail: 'invitee6@example.com',
        })
        .expect(429);

      expect(res.body).toMatchObject({
        status: 429,
        detail: expect.stringContaining("Quota d'invitations atteint"),
      });
    });
  });
});
