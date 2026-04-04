/* eslint-disable @typescript-eslint/unbound-method */
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { DeleteGoalUseCase } from './DeleteGoal.useCase';
import {
  buildSebastianGoal,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('DeleteGoalUseCase', () => {
  let useCase: DeleteGoalUseCase;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  beforeEach(() => {
    goalRepo = createMockSebastianGoalRepo();
    useCase = new DeleteGoalUseCase(goalRepo);
  });

  it("devrait rejeter si l'objectif n'existe pas", async () => {
    goalRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', goalId: 'goal-1' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("devrait rejeter si l'utilisateur n'est pas proprietaire", async () => {
    goalRepo.findById.mockResolvedValue(
      buildSebastianGoal({ userId: 'other-user' }),
    );

    await expect(
      useCase.execute({ userId: 'user-1', goalId: 'goal-1' }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("devrait supprimer l'objectif avec succes", async () => {
    const goal = buildSebastianGoal({ userId: 'user-1' });
    goalRepo.findById.mockResolvedValue(goal);
    goalRepo.delete.mockResolvedValue(undefined);

    await useCase.execute({ userId: 'user-1', goalId: 'goal-1' });

    expect(goalRepo.findById).toHaveBeenCalledWith('goal-1');
    expect(goalRepo.delete).toHaveBeenCalledWith('goal-1');
  });
});
