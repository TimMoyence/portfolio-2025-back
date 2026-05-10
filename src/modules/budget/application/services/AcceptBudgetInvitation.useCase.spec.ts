/* eslint-disable @typescript-eslint/unbound-method */
import { createHash } from 'crypto';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { AcceptBudgetInvitationUseCase } from './AcceptBudgetInvitation.useCase';
import {
  buildBudgetGroup,
  buildBudgetInvitation,
  createMockBudgetGroupRepo,
  createMockBudgetInvitationRepo,
} from '../../../../../test/factories/budget.factory';
import {
  InvalidInvitationTokenError,
  InvitationAlreadyConsumedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationRevokedError,
} from '../../domain/errors/InvitationErrors';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetInvitationRepository } from '../../domain/IBudgetInvitation.repository';
import type { AcceptBudgetInvitationCommand } from '../dto/AcceptBudgetInvitation.command';

describe('AcceptBudgetInvitationUseCase', () => {
  let invitationRepo: jest.Mocked<IBudgetInvitationRepository>;
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;
  let useCase: AcceptBudgetInvitationUseCase;

  /** Token clair et son hash SHA-256 (utilise pour verifier l'invariant). */
  const tokenClear = 'abc123validtoken';
  const tokenHash = createHash('sha256').update(tokenClear).digest('hex');

  /** Commande de reference reutilisee par la majorite des tests. */
  const baseCommand: AcceptBudgetInvitationCommand = {
    tokenClear,
    acceptedByUserId: 'user-99',
    acceptedByEmail: 'bob@example.com',
  };

  beforeEach(() => {
    invitationRepo = createMockBudgetInvitationRepo();
    groupRepo = createMockBudgetGroupRepo();
    useCase = new AcceptBudgetInvitationUseCase(invitationRepo, groupRepo);
  });

  describe('happy path', () => {
    beforeEach(() => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          id: 'inv-1',
          groupId: 'group-1',
          targetEmail: 'bob@example.com',
          tokenHash,
          isPending: () => true,
          isExpired: () => false,
        }),
      );
      groupRepo.findById.mockResolvedValue(
        buildBudgetGroup({ id: 'group-1', name: 'Couple' }),
      );
      groupRepo.isMember.mockResolvedValue(false);
      groupRepo.addMember.mockResolvedValue(undefined);
      invitationRepo.markAccepted.mockResolvedValue(undefined);
    });

    it('accepte l invitation, ajoute au groupe et marque acceptee', async () => {
      const result = await useCase.execute(baseCommand);

      expect(result).toEqual({ groupId: 'group-1', groupName: 'Couple' });
      expect(groupRepo.addMember).toHaveBeenCalledWith('group-1', 'user-99');
      expect(invitationRepo.markAccepted).toHaveBeenCalledWith(
        'inv-1',
        'user-99',
        expect.any(Date),
      );
    });

    it('recalcule le hash SHA-256 du tokenClear pour matcher en base (invariant critique)', async () => {
      await useCase.execute(baseCommand);

      // Le repo doit avoir ete interroge avec le hash SHA-256 et JAMAIS avec le clair.
      expect(invitationRepo.findByTokenHash).toHaveBeenCalledTimes(1);
      expect(invitationRepo.findByTokenHash).toHaveBeenCalledWith(tokenHash);
      expect(invitationRepo.findByTokenHash).not.toHaveBeenCalledWith(
        tokenClear,
      );
    });
  });

  describe('erreurs typees', () => {
    it('throw InvalidInvitationTokenError si token inconnu (hash absent en base)', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        useCase.execute({ ...baseCommand, tokenClear: 'unknown' }),
      ).rejects.toBeInstanceOf(InvalidInvitationTokenError);
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });

    it('throw InvitationAlreadyConsumedError si acceptedAt deja defini', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          tokenHash,
          acceptedAt: new Date('2026-05-09T00:00:00Z'),
          acceptedByUserId: 'user-other',
        }),
      );

      await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
        InvitationAlreadyConsumedError,
      );
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });

    it('throw InvitationRevokedError si revokedAt defini', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          tokenHash,
          revokedAt: new Date('2026-05-09T00:00:00Z'),
        }),
      );

      await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
        InvitationRevokedError,
      );
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });

    it('throw InvitationExpiredError si expiresAt depasse', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          tokenHash,
          expiresAt: new Date('2020-01-01T00:00:00Z'),
          isExpired: () => true,
          isPending: () => false,
        }),
      );

      await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
        InvitationExpiredError,
      );
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });

    it('throw InvitationEmailMismatchError si email different (case insensitive)', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          tokenHash,
          targetEmail: 'bob@example.com',
        }),
      );

      await expect(
        useCase.execute({ ...baseCommand, acceptedByEmail: 'alice@other.com' }),
      ).rejects.toBeInstanceOf(InvitationEmailMismatchError);
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });

    it('accepte l invitation meme si la casse de l email differe (Bob@Example.COM vs bob@example.com)', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          id: 'inv-1',
          groupId: 'group-1',
          tokenHash,
          targetEmail: 'bob@example.com',
        }),
      );
      groupRepo.findById.mockResolvedValue(
        buildBudgetGroup({ id: 'group-1', name: 'Couple' }),
      );
      groupRepo.isMember.mockResolvedValue(false);

      await expect(
        useCase.execute({ ...baseCommand, acceptedByEmail: 'Bob@Example.COM' }),
      ).resolves.toEqual({ groupId: 'group-1', groupName: 'Couple' });
    });

    it('throw ResourceNotFoundError si le groupe cible a ete supprime entre temps', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          tokenHash,
          targetEmail: 'bob@example.com',
          groupId: 'group-deleted',
        }),
      );
      groupRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(
        ResourceNotFoundError,
      );
      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).not.toHaveBeenCalled();
    });
  });

  describe('idempotence', () => {
    it('si user deja membre, marque accepte sans re-add (pas de double insert)', async () => {
      invitationRepo.findByTokenHash.mockResolvedValue(
        buildBudgetInvitation({
          id: 'inv-1',
          groupId: 'group-1',
          targetEmail: 'bob@example.com',
          tokenHash,
        }),
      );
      groupRepo.findById.mockResolvedValue(
        buildBudgetGroup({ id: 'group-1', name: 'Couple' }),
      );
      groupRepo.isMember.mockResolvedValue(true);
      invitationRepo.markAccepted.mockResolvedValue(undefined);

      const result = await useCase.execute(baseCommand);

      expect(groupRepo.addMember).not.toHaveBeenCalled();
      expect(invitationRepo.markAccepted).toHaveBeenCalledWith(
        'inv-1',
        'user-99',
        expect.any(Date),
      );
      expect(result).toEqual({ groupId: 'group-1', groupName: 'Couple' });
    });
  });
});
