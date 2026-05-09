/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ConfigService } from '@nestjs/config';
import { ShareBudgetUseCase } from './ShareBudget.useCase';
import {
  createMockBudgetGroupRepo,
  buildBudgetGroup,
  createMockBudgetShareNotifier,
  createMockBudgetShareAttemptRepo,
} from '../../../../../test/factories/budget.factory';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../../test/factories/user.factory';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import type { IBudgetShareAttemptRepository } from '../../domain/IBudgetShareAttempt.repository';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

describe('ShareBudgetUseCase', () => {
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let notifier: jest.Mocked<IBudgetShareNotifier>;
  let shareAttemptRepo: jest.Mocked<IBudgetShareAttemptRepository>;
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
    configService = { get: jest.fn().mockReturnValue('http://localhost:4200') };
    useCase = new ShareBudgetUseCase(
      groupRepo,
      usersRepo,
      notifier,
      shareAttemptRepo,
      configService as unknown as ConfigService,
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
    shareAttemptRepo.findRecent.mockResolvedValue(null);
    shareAttemptRepo.record.mockResolvedValue(undefined);
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

  it("devrait rejeter si l'email cible n'a pas de compte", async () => {
    usersRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute(command)).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it("devrait ajouter le membre et envoyer l'email", async () => {
    const result = await useCase.execute(command);

    expect(groupRepo.addMember).toHaveBeenCalledWith('group-1', 'user-2');
    expect(notifier.sendBudgetShareNotification).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ shared: true, userId: 'user-2' });
  });

  it('devrait ne pas re-ajouter un membre deja present', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    const result = await useCase.execute(command);

    expect(groupRepo.addMember).not.toHaveBeenCalled();
    expect(result).toEqual({ shared: true, userId: 'user-2' });
  });

  it("devrait continuer meme si l'envoi d'email echoue", async () => {
    notifier.sendBudgetShareNotification.mockRejectedValue(
      new Error('SMTP error'),
    );

    const result = await useCase.execute(command);

    expect(result).toEqual({ shared: true, userId: 'user-2' });
  });

  it('CRIT-2 — ne devrait PAS envoyer de mail si la cible est deja membre (anti spam)', async () => {
    groupRepo.isMember.mockResolvedValue(true);

    await useCase.execute(command);

    expect(notifier.sendBudgetShareNotification).not.toHaveBeenCalled();
    expect(shareAttemptRepo.record).not.toHaveBeenCalled();
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

  it('devrait passer les bonnes valeurs au notifier', async () => {
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
