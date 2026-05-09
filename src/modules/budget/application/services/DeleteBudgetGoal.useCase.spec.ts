/* eslint-disable @typescript-eslint/unbound-method */
import { DeleteBudgetGoalUseCase } from './DeleteBudgetGoal.useCase';
import {
  buildBudgetGoal,
  createMockBudgetGoalRepo,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';

describe('DeleteBudgetGoalUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let goalRepo: ReturnType<typeof createMockBudgetGoalRepo>;
  let useCase: DeleteBudgetGoalUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    goalRepo = createMockBudgetGoalRepo();
    useCase = new DeleteBudgetGoalUseCase(groupRepo, goalRepo);
  });

  it('supprime un goal pour un membre', async () => {
    goalRepo.findById.mockResolvedValueOnce(
      buildBudgetGoal({ groupId: 'group-1' }),
    );
    groupRepo.isMember.mockResolvedValueOnce(true);
    goalRepo.delete.mockResolvedValueOnce();

    await useCase.execute({ goalId: 'goal-1', userId: 'user-1' });

    expect(goalRepo.delete).toHaveBeenCalledWith('goal-1');
  });

  it('throw ResourceNotFoundError si goal absent', async () => {
    goalRepo.findById.mockResolvedValueOnce(null);
    await expect(
      useCase.execute({ goalId: 'missing', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(goalRepo.delete).not.toHaveBeenCalled();
  });

  it('throw InsufficientPermissionsError si user non-membre', async () => {
    goalRepo.findById.mockResolvedValueOnce(
      buildBudgetGoal({ groupId: 'group-1' }),
    );
    groupRepo.isMember.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({ goalId: 'goal-1', userId: 'user-x' }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(goalRepo.delete).not.toHaveBeenCalled();
  });
});
