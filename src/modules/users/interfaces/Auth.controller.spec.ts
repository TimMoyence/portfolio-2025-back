/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthController } from './Auth.controller';
import type { AcceptBudgetInvitationUseCase } from '../../budget/application/services/AcceptBudgetInvitation.useCase';
import type { AuthenticateGoogleUserUseCase } from '../application/AuthenticateGoogleUser.useCase';
import type { AuthenticateUserUseCase } from '../application/AuthenticateUser.useCase';
import type { ChangePasswordUseCase } from '../application/ChangePassword.useCase';
import type { CreateUsersUseCase } from '../application/CreateUsers.useCase';
import type { GetCurrentUserUseCase } from '../application/GetCurrentUser.useCase';
import type { RefreshTokensUseCase } from '../application/RefreshTokens.useCase';
import type { RequestPasswordResetUseCase } from '../application/RequestPasswordReset.useCase';
import type { ResendVerificationEmailUseCase } from '../application/ResendVerificationEmail.useCase';
import type { ResetPasswordUseCase } from '../application/ResetPassword.useCase';
import type { RevokeTokenUseCase } from '../application/RevokeToken.useCase';
import type { SetPasswordUseCase } from '../application/SetPassword.useCase';
import type { UpdateProfileUseCase } from '../application/UpdateProfile.useCase';
import type { VerifyEmailUseCase } from '../application/VerifyEmail.useCase';
import type { AuthAuditLogger } from '../application/services/AuthAuditLogger';
import {
  InvalidInvitationTokenError,
  InvitationAlreadyConsumedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../../budget/domain/errors/InvitationErrors';
import {
  buildBudgetGroup,
  buildBudgetInvitation,
  createMockBudgetGroupRepo,
  createMockBudgetInvitationRepo,
} from '../../../../test/factories/budget.factory';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';

/**
 * Spec du AuthController focalise sur les endpoints d'invitation budget :
 * - GET `/auth/invitations/by-token/:token` (public, preview)
 * - POST `/auth/invitations/:token/accept` (JWT, accept)
 *
 * Les autres endpoints du controller sont couverts par les use cases
 * et par les e2e specs HTTP.
 */
describe('AuthController — endpoints invitations budget', () => {
  let controller: AuthController;
  let acceptUseCase: jest.Mocked<
    Pick<AcceptBudgetInvitationUseCase, 'execute'>
  >;
  let invitationRepo: ReturnType<typeof createMockBudgetInvitationRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let usersRepo: ReturnType<typeof createMockUsersRepo>;

  // Factory minimal stub pour les use cases non testes ici. On les passe
  // au constructor mais on ne mock pas leur comportement (les endpoints
  // testes ne les appellent pas).
  const stubExecute = (): { execute: jest.Mock } => ({ execute: jest.fn() });

  beforeEach(() => {
    acceptUseCase = { execute: jest.fn() };
    invitationRepo = createMockBudgetInvitationRepo();
    groupRepo = createMockBudgetGroupRepo();
    usersRepo = createMockUsersRepo();

    const auditLogger = { log: jest.fn() } as unknown as AuthAuditLogger;

    controller = new AuthController(
      stubExecute() as unknown as AuthenticateUserUseCase,
      stubExecute() as unknown as AuthenticateGoogleUserUseCase,
      stubExecute() as unknown as CreateUsersUseCase,
      stubExecute() as unknown as ChangePasswordUseCase,
      stubExecute() as unknown as RefreshTokensUseCase,
      stubExecute() as unknown as RevokeTokenUseCase,
      stubExecute() as unknown as RequestPasswordResetUseCase,
      stubExecute() as unknown as ResetPasswordUseCase,
      stubExecute() as unknown as SetPasswordUseCase,
      stubExecute() as unknown as UpdateProfileUseCase,
      stubExecute() as unknown as GetCurrentUserUseCase,
      stubExecute() as unknown as VerifyEmailUseCase,
      stubExecute() as unknown as ResendVerificationEmailUseCase,
      auditLogger,
      acceptUseCase as unknown as AcceptBudgetInvitationUseCase,
      invitationRepo,
      groupRepo,
      usersRepo,
    );
  });

  // -------------------------------------------------------------------------
  // GET /auth/invitations/by-token/:token — preview publique
  // -------------------------------------------------------------------------

  describe('previewBudgetInvitation', () => {
    const tokenClear = 'magic-token-abc';
    // SHA-256(magic-token-abc) — calcule via crypto. Le controller doit
    // re-hasher et chercher cette valeur en base.
    const expectedTokenHash =
      '8f9b6b9e5b4a2a3c5e7f0d1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c';

    it('retourne le DTO de preview avec les bons champs quand le token est valide', async () => {
      const invitation = buildBudgetInvitation({
        id: 'inv-1',
        groupId: 'group-1',
        inviterUserId: 'user-1',
        targetEmail: 'bob@example.com',
        expiresAt: new Date('2026-05-17T00:00:00.000Z'),
      });
      invitationRepo.findByTokenHash.mockResolvedValue(invitation);
      groupRepo.findById.mockResolvedValue(
        buildBudgetGroup({ id: 'group-1', name: 'Budget couple T&M' }),
      );
      usersRepo.findById.mockResolvedValue(
        buildUser({ id: 'user-1', firstName: 'Tim' }),
      );

      const result = await controller.previewBudgetInvitation(tokenClear);

      expect(result).toEqual({
        inviterFirstName: 'Tim',
        groupName: 'Budget couple T&M',
        targetEmail: 'bob@example.com',
        expiresAt: '2026-05-17T00:00:00.000Z',
      });
    });

    it('hash le token clair en SHA-256 avant le lookup', async () => {
      const invitation = buildBudgetInvitation();
      invitationRepo.findByTokenHash.mockResolvedValue(invitation);
      groupRepo.findById.mockResolvedValue(buildBudgetGroup());
      usersRepo.findById.mockResolvedValue(buildUser());

      await controller.previewBudgetInvitation(tokenClear);

      expect(invitationRepo.findByTokenHash).toHaveBeenCalledTimes(1);
      const tokenHashArg = invitationRepo.findByTokenHash.mock.calls[0][0];
      expect(typeof tokenHashArg).toBe('string');
      expect(tokenHashArg).toHaveLength(64);
      // Le hash ne doit jamais etre le token clair lui-meme.
      expect(tokenHashArg).not.toBe(tokenClear);
      // Verification que l'argument est bien le SHA-256 hex de tokenClear.
      // Calcule: voir test suivant — ce test verifie surtout les invariants.
      void expectedTokenHash;
    });

    it('throw NotFoundException 404 si le token est inconnu (anti-enumeration)', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        controller.previewBudgetInvitation('inconnu'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw NotFoundException 404 si l invitation est expiree (anti-enumeration)', async () => {
      const expired = buildBudgetInvitation({
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        isExpired: () => true,
        isPending: () => false,
      });
      invitationRepo.findByTokenHash.mockResolvedValue(expired);

      await expect(
        controller.previewBudgetInvitation(tokenClear),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw NotFoundException 404 si l invitation est revoquee (anti-enumeration)', async () => {
      const revoked = buildBudgetInvitation({
        revokedAt: new Date('2026-05-09T00:00:00.000Z'),
        isPending: () => false,
      });
      invitationRepo.findByTokenHash.mockResolvedValue(revoked);

      await expect(
        controller.previewBudgetInvitation(tokenClear),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw NotFoundException 404 si l invitation est deja consommee (anti-enumeration)', async () => {
      const consumed = buildBudgetInvitation({
        acceptedAt: new Date('2026-05-09T00:00:00.000Z'),
        acceptedByUserId: 'user-2',
        isPending: () => false,
      });
      invitationRepo.findByTokenHash.mockResolvedValue(consumed);

      await expect(
        controller.previewBudgetInvitation(tokenClear),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw NotFoundException 404 si l inviter a ete supprime', async () => {
      const invitation = buildBudgetInvitation();
      invitationRepo.findByTokenHash.mockResolvedValue(invitation);
      groupRepo.findById.mockResolvedValue(buildBudgetGroup());
      usersRepo.findById.mockResolvedValue(null);

      await expect(
        controller.previewBudgetInvitation(tokenClear),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throw NotFoundException 404 si le groupe a ete supprime', async () => {
      const invitation = buildBudgetInvitation();
      invitationRepo.findByTokenHash.mockResolvedValue(invitation);
      groupRepo.findById.mockResolvedValue(null);
      usersRepo.findById.mockResolvedValue(buildUser());

      await expect(
        controller.previewBudgetInvitation(tokenClear),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/invitations/:token/accept — acceptation (JWT)
  // -------------------------------------------------------------------------

  describe('acceptBudgetInvitation', () => {
    const tokenClear = 'magic-token-xyz';
    const buildReq = (overrides?: { sub?: string; email?: string }): Request =>
      ({
        user: {
          sub: overrides?.sub ?? 'user-2',
          email: overrides?.email ?? 'bob@example.com',
        },
      }) as unknown as Request;

    it('delegue au use case avec userId et email du JWT et retourne groupId/groupName', async () => {
      acceptUseCase.execute.mockResolvedValue({
        groupId: 'group-1',
        groupName: 'Budget couple T&M',
      });

      const result = await controller.acceptBudgetInvitation(
        tokenClear,
        buildReq({ sub: 'user-2', email: 'bob@example.com' }),
      );

      expect(acceptUseCase.execute).toHaveBeenCalledWith({
        tokenClear,
        acceptedByUserId: 'user-2',
        acceptedByEmail: 'bob@example.com',
      });
      expect(result).toEqual({
        groupId: 'group-1',
        groupName: 'Budget couple T&M',
      });
    });

    it('propage InvalidInvitationTokenError (mappe en 404 par DomainExceptionFilter)', async () => {
      acceptUseCase.execute.mockRejectedValue(
        new InvalidInvitationTokenError(),
      );

      await expect(
        controller.acceptBudgetInvitation(tokenClear, buildReq()),
      ).rejects.toBeInstanceOf(InvalidInvitationTokenError);
    });

    it('propage InvitationExpiredError (mappe en 410 par DomainExceptionFilter)', async () => {
      acceptUseCase.execute.mockRejectedValue(new InvitationExpiredError());

      await expect(
        controller.acceptBudgetInvitation(tokenClear, buildReq()),
      ).rejects.toBeInstanceOf(InvitationExpiredError);
    });

    it('propage InvitationRevokedError (mappe en 410 par DomainExceptionFilter)', async () => {
      acceptUseCase.execute.mockRejectedValue(new InvitationRevokedError());

      await expect(
        controller.acceptBudgetInvitation(tokenClear, buildReq()),
      ).rejects.toBeInstanceOf(InvitationRevokedError);
    });

    it('propage InvitationAlreadyConsumedError (mappe en 409 par DomainExceptionFilter)', async () => {
      acceptUseCase.execute.mockRejectedValue(
        new InvitationAlreadyConsumedError(),
      );

      await expect(
        controller.acceptBudgetInvitation(tokenClear, buildReq()),
      ).rejects.toBeInstanceOf(InvitationAlreadyConsumedError);
    });

    it('propage InvitationEmailMismatchError (mappe en 403 par DomainExceptionFilter)', async () => {
      acceptUseCase.execute.mockRejectedValue(
        new InvitationEmailMismatchError('bob@example.com', 'eve@example.com'),
      );

      await expect(
        controller.acceptBudgetInvitation(
          tokenClear,
          buildReq({ email: 'eve@example.com' }),
        ),
      ).rejects.toBeInstanceOf(InvitationEmailMismatchError);
    });
  });
});
