/* eslint-disable @typescript-eslint/unbound-method */
import { CreateBudgetGroupUseCase } from './CreateBudgetGroup.useCase';
import {
  createMockBudgetGroupRepo,
  buildBudgetGroup,
} from '../../../../../test/factories/budget.factory';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { CreateBudgetGroupCommand } from '../dto/CreateBudgetGroup.command';

describe('CreateBudgetGroupUseCase', () => {
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;
  let useCase: CreateBudgetGroupUseCase;

  const command: CreateBudgetGroupCommand = {
    name: 'Mon budget',
    userId: 'user-1',
  };

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    useCase = new CreateBudgetGroupUseCase(groupRepo);
  });

  it("devrait retourner le groupe existant si l'utilisateur en possede un", async () => {
    const existing = buildBudgetGroup({ ownerId: 'user-1' });
    groupRepo.findByOwnerId.mockResolvedValue([existing]);

    const result = await useCase.execute(command);

    expect(groupRepo.create).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });

  it("devrait creer un nouveau groupe si aucun n'existe", async () => {
    const created = buildBudgetGroup({ name: 'Mon budget', ownerId: 'user-1' });
    groupRepo.findByOwnerId.mockResolvedValue([]);
    groupRepo.create.mockResolvedValue(created);

    const result = await useCase.execute(command);

    expect(groupRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(created);
  });

  it("devrait passer le nom et l'ownerId au domaine", async () => {
    const created = buildBudgetGroup({ name: 'Mon budget', ownerId: 'user-1' });
    groupRepo.findByOwnerId.mockResolvedValue([]);
    groupRepo.create.mockResolvedValue(created);

    await useCase.execute(command);

    const passedGroup = groupRepo.create.mock.calls[0][0];
    expect(passedGroup.name).toBe('Mon budget');
    expect(passedGroup.ownerId).toBe('user-1');
  });
});
