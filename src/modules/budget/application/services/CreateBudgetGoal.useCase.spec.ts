/* eslint-disable @typescript-eslint/unbound-method */
import { CreateBudgetGoalUseCase } from './CreateBudgetGoal.useCase';
import {
  createMockBudgetGoalRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../../../common/domain/errors/InvalidInputError';

describe('CreateBudgetGoalUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let goalRepo: ReturnType<typeof createMockBudgetGoalRepo>;
  let useCase: CreateBudgetGoalUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    goalRepo = createMockBudgetGoalRepo();
    useCase = new CreateBudgetGoalUseCase(groupRepo, goalRepo);
  });

  it('cree un goal SAVINGS pour un membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.create.mockImplementationOnce((g) => Promise.resolve(g));

    const result = await useCase.execute({
      groupId: 'group-1',
      userId: 'user-1',
      name: 'Vacances',
      kind: 'SAVINGS',
      targetAmount: 1000,
      categoryId: null,
      deadline: null,
    });

    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(goalRepo.create).toHaveBeenCalledTimes(1);
    expect(result.kind).toBe('SAVINGS');
    expect(result.name).toBe('Vacances');
    expect(result.createdByUserId).toBe('user-1');
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);

    await expect(
      useCase.execute({
        groupId: 'group-1',
        userId: 'user-1',
        name: 'X',
        kind: 'SAVINGS',
        targetAmount: 100,
        categoryId: null,
        deadline: null,
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(goalRepo.create).not.toHaveBeenCalled();
  });

  it('CATEGORY_LIMIT sans categoryId throw InvalidInputError (delegue au domain)', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    await expect(
      useCase.execute({
        groupId: 'group-1',
        userId: 'user-1',
        name: 'X',
        kind: 'CATEGORY_LIMIT',
        targetAmount: 500,
        categoryId: null,
        deadline: null,
      }),
    ).rejects.toBeInstanceOf(InvalidInputError);
    expect(goalRepo.create).not.toHaveBeenCalled();
  });

  it('CATEGORY_LIMIT avec categoryId persiste OK', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.create.mockImplementationOnce((g) => Promise.resolve(g));
    const result = await useCase.execute({
      groupId: 'group-1',
      userId: 'user-1',
      name: 'Bouffe',
      kind: 'CATEGORY_LIMIT',
      targetAmount: 600,
      categoryId: 'cat-1',
      deadline: null,
    });
    expect(result.categoryId).toBe('cat-1');
  });
});
