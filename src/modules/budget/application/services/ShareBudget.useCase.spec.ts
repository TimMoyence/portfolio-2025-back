/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { ConfigService } from '@nestjs/config';
import { ShareBudgetUseCase } from './ShareBudget.useCase';
import {
  createMockBudgetGroupRepo,
  buildBudgetGroup,
  createMockBudgetShareNotifier,
} from '../../../../../test/factories/budget.factory';
import {
  createMockUsersRepo,
  buildUser,
} from '../../../../../test/factories/user.factory';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

describe('ShareBudgetUseCase', () => {
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;
  let usersRepo: jest.Mocked<IUsersRepository>;
  let notifier: jest.Mocked<IBudgetShareNotifier>;
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
    configService = { get: jest.fn().mockReturnValue('http://localhost:4200') };
    useCase = new ShareBudgetUseCase(
      groupRepo,
      usersRepo,
      notifier,
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
