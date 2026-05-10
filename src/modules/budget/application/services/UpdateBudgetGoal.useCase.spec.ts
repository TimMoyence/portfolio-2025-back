/* eslint-disable @typescript-eslint/unbound-method */
import { UpdateBudgetGoalUseCase } from './UpdateBudgetGoal.useCase';
import {
  buildBudgetGoal,
  createMockBudgetGoalRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../../../common/domain/errors/InvalidInputError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';

describe('UpdateBudgetGoalUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let goalRepo: ReturnType<typeof createMockBudgetGoalRepo>;
  let useCase: UpdateBudgetGoalUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    goalRepo = createMockBudgetGoalRepo();
    useCase = new UpdateBudgetGoalUseCase(groupRepo, goalRepo);
  });

  it('met a jour un goal pour un membre', async () => {
    const existing = buildBudgetGoal({
      id: 'goal-1',
      groupId: 'group-1',
      name: 'Old',
    });
    goalRepo.findById.mockResolvedValueOnce(existing);
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.update.mockResolvedValueOnce(
      buildBudgetGoal({ id: 'goal-1', name: 'New' }),
    );

    const result = await useCase.execute({
      goalId: 'goal-1',
      userId: 'user-1',
      patch: { name: 'New' },
    });

    expect(goalRepo.findById).toHaveBeenCalledWith('goal-1');
    expect(groupRepo.isMember).toHaveBeenCalledWith('group-1', 'user-1');
    expect(goalRepo.update).toHaveBeenCalledWith('goal-1', { name: 'New' });
    expect(result.name).toBe('New');
  });

  it('throw ResourceNotFoundError si goal absent', async () => {
    goalRepo.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({
        goalId: 'missing',
        userId: 'user-1',
        patch: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(groupRepo.isMember).not.toHaveBeenCalled();
  });

  it('throw InsufficientPermissionsError si user non-membre du groupe du goal', async () => {
    goalRepo.findById.mockResolvedValueOnce(
      buildBudgetGoal({ groupId: 'group-1' }),
    );
    groupRepo.isMember.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({
        goalId: 'goal-1',
        userId: 'user-x',
        patch: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(goalRepo.update).not.toHaveBeenCalled();
  });

  it('throw InvalidInputError si patch CATEGORY_LIMIT sans categoryId', async () => {
    goalRepo.findById.mockResolvedValueOnce(
      buildBudgetGoal({ kind: 'SAVINGS', categoryId: null }),
    );
    groupRepo.isMember.mockResolvedValueOnce(true);
    await expect(
      useCase.execute({
        goalId: 'goal-1',
        userId: 'user-1',
        patch: { kind: 'CATEGORY_LIMIT' },
      }),
    ).rejects.toBeInstanceOf(InvalidInputError);
    expect(goalRepo.update).not.toHaveBeenCalled();
  });
});
