/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { RateLimitExceededError } from '../../../../common/domain/errors/RateLimitExceededError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ConfigService } from '@nestjs/config';
import { ShareBudgetUseCase } from './ShareBudget.useCase';
import {
  buildBudgetGroup,
  buildBudgetInvitation,
  createMockBudgetGroupRepo,
  createMockBudgetInvitationRepo,
  createMockBudgetShareAttemptRepo,
  createMockBudgetShareNotifier,
} from '../../../../../test/factories/budget.factory';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../../test/factories/user.factory';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetInvitationRepository } from '../../domain/IBudgetInvitation.repository';
import type { IBudgetShareAttemptRepository } from '../../domain/IBudgetShareAttempt.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

describe('ShareBudgetUseCase', () => {
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let notifier: jest.Mocked<IBudgetShareNotifier>;
  let shareAttemptRepo: jest.Mocked<IBudgetShareAttemptRepository>;
  let invitationRepo: jest.Mocked<IBudgetInvitationRepository>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let useCase: ShareBudgetUseCase;

  const command: ShareBudgetCommand = {
    userId: 'user-1',
    groupId: 'group-1',
    targetEmail: 'cible@example.com',
  };

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    usersRepo = createMockUsersRepo();
    notifier = createMockBudgetShareNotifier();
    shareAttemptRepo = createMockBudgetShareAttemptRepo();
    invitationRepo = createMockBudgetInvitationRepo();
    configService = { get: jest.fn().mockReturnValue('http://localhost:4200') };
    useCase = new ShareBudgetUseCase(
      groupRepo,
      usersRepo,
      notifier,
      shareAttemptRepo,
      configService as unknown as ConfigService,
      invitationRepo,
    );

    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'group-1', ownerId: 'user-1' }),
    );
    groupRepo.isMember.mockResolvedValue(false);
    groupRepo.addMember.mockResolvedValue(undefined);
    usersRepo.findByEmail.mockResolvedValue(
      buildUser({
        id: 'user-2',
        email: 'cible@example.com',
        firstName: 'Marie',
      }),
    );
    usersRepo.findById.mockResolvedValue(
      buildUser({ id: 'user-1', firstName: 'Jean', lastName: 'Dupont' }),
    );
    notifier.sendBudgetShareNotification.mockResolvedValue(undefined);
    notifier.sendBudgetInvitation.mockResolvedValue(undefined);
    shareAttemptRepo.findRecent.mockResolvedValue(null);
    shareAttemptRepo.record.mockResolvedValue(undefined);
    shareAttemptRepo.countByInviterSince.mockResolvedValue(0);
    invitationRepo.findActiveByGroupAndEmail.mockResolvedValue(null);
    invitationRepo.create.mockResolvedValue(buildBudgetInvitation());
    invitationRepo.markRevoked.mockResolvedValue(undefined);
  });

  it("devrait rejeter si le groupe n'existe pas", async () => {
    groupRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it("devrait rejeter si l'utilisateur n'est pas le proprietaire", async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'group-1', ownerId: 'autre-user' }),
    );

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      InsufficientPermissionsError,
    );
  });

  it('partage avec un utilisateur existant retourne status "shared"', async () => {
    const result = await useCase.execute(command);

    expect(result).toEqual({ status: 'shared' });
  });

  it('devrait appeler addMember sur le repo lors d un partage initial', async () => {
    await useCase.execute(command);

    expect(groupRepo.addMember).toHaveBeenCalledWith('group-1', 'user-2');
  });

  it('devrait declencher l envoi du mail "shared" lors d un partage initial', async () => {
    await useCase.execute(command);

    expect(notifier.sendBudgetShareNotification).toHaveBeenCalledTimes(1);
  });

  it('retourne "already-member" si la cible est deja membre', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    const result = await useCase.execute(command);

    expect(result).toEqual({ status: 'already-member' });
    expect(groupRepo.addMember).not.toHaveBeenCalled();
    expect(notifier.sendBudgetShareNotification).not.toHaveBeenCalled();
    expect(notifier.sendBudgetInvitation).not.toHaveBeenCalled();
  });

  it('retourne "invited" et envoie un mail magic-link si la cible n a pas de compte', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'group-1', ownerId: 'user-1', name: 'Couple' }),
    );
    usersRepo.findByEmail.mockResolvedValue(null);
    usersRepo.findById.mockResolvedValue(
      buildUser({ id: 'user-1', firstName: 'Tim', lastName: 'Moyence' }),
    );
    invitationRepo.findActiveByGroupAndEmail.mockResolvedValue(null);
    invitationRepo.create.mockResolvedValue(buildBudgetInvitation());

    const result = await useCase.execute({
      groupId: 'group-1',
      targetEmail: 'bob@example.com',
      userId: 'user-1',
    });

    expect(result).toEqual({ status: 'invited' });
    expect(invitationRepo.create).toHaveBeenCalledTimes(1);
    expect(notifier.sendBudgetInvitation).toHaveBeenCalledTimes(1);
    expect(notifier.sendBudgetShareNotification).not.toHaveBeenCalled();
    expect(groupRepo.addMember).not.toHaveBeenCalled();
  });

  it('revoque l invitation existante et en cree une nouvelle si re-share', async () => {
    usersRepo.findByEmail.mockResolvedValue(null);
    invitationRepo.findActiveByGroupAndEmail.mockResolvedValue(
      buildBudgetInvitation({ id: 'inv-old' }),
    );
    invitationRepo.create.mockResolvedValue(
      buildBudgetInvitation({ id: 'inv-new' }),
    );

    await useCase.execute(command);

    expect(invitationRepo.markRevoked).toHaveBeenCalledWith(
      'inv-old',
      expect.any(Date),
    );
    expect(invitationRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throw RateLimitExceededError si quota 5/24h depasse', async () => {
    shareAttemptRepo.countByInviterSince.mockResolvedValue(5);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );

    expect(usersRepo.findByEmail).not.toHaveBeenCalled();
  });

  it('P0-4 — addMember en violation UNIQUE doit etre traite comme idempotent (race)', async () => {
    groupRepo.isMember.mockResolvedValue(false);
    groupRepo.addMember.mockRejectedValue(
      new Error(
        'duplicate key value violates unique constraint "budget_group_members_group_id_user_id_key"',
      ),
    );

    const result = await useCase.execute(command);

    // Race condition idempotente : on retourne shared sans throw,
    // ni mail (la cible est deja membre, ajoute par l'autre branche).
    expect(result).toEqual({ status: 'shared' });
    expect(notifier.sendBudgetShareNotification).not.toHaveBeenCalled();
    expect(shareAttemptRepo.record).not.toHaveBeenCalled();
  });

  it('P0-4 — devrait propager les autres erreurs de addMember (non-unique)', async () => {
    groupRepo.isMember.mockResolvedValue(false);
    groupRepo.addMember.mockRejectedValue(new Error('connection refused'));

    await expect(useCase.execute(command)).rejects.toThrow(
      'connection refused',
    );
  });

  it('CRIT-2 — ne devrait PAS envoyer de mail si une tentative recente existe (cooldown)', async () => {
    shareAttemptRepo.findRecent.mockResolvedValue({
      sentAt: new Date(Date.now() - 60_000),
    });

    await useCase.execute(command);

    expect(notifier.sendBudgetShareNotification).not.toHaveBeenCalled();
    expect(shareAttemptRepo.record).not.toHaveBeenCalled();
  });

  it("CRIT-2 — devrait enregistrer la tentative avant l'envoi du mail (cooldown SMTP-fail-safe)", async () => {
    await useCase.execute(command);

    expect(shareAttemptRepo.record).toHaveBeenCalledWith(
      'group-1',
      'cible@example.com',
      expect.any(Date),
      'user-1',
    );
  });

  it('CRIT-2 — devrait passer la fenetre de cooldown au repo (5 minutes)', async () => {
    await useCase.execute(command);

    expect(shareAttemptRepo.findRecent).toHaveBeenCalledWith(
      'group-1',
      'cible@example.com',
      expect.any(Date),
    );
    const sinceArg =
      shareAttemptRepo.findRecent.mock.calls[0]?.[2] ?? new Date(0);
    const elapsedMs = Date.now() - sinceArg.getTime();
    expect(elapsedMs).toBeGreaterThanOrEqual(5 * 60 * 1000 - 1000);
    expect(elapsedMs).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
  });

  it('devrait passer les bonnes valeurs au notifier "shared"', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({
        id: 'group-1',
        ownerId: 'user-1',
        name: 'Budget couple T&M',
      }),
    );

    await useCase.execute(command);

    expect(notifier.sendBudgetShareNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        targetEmail: 'cible@example.com',
        targetFirstName: 'Marie',
        ownerFirstName: 'Jean',
        groupName: 'Budget couple T&M',
      }),
    );
  });
});
