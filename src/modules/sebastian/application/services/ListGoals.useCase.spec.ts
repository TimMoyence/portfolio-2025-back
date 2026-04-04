/* eslint-disable @typescript-eslint/unbound-method */
import { ListGoalsUseCase } from './ListGoals.useCase';
import {
  buildSebastianGoal,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('ListGoalsUseCase', () => {
  let useCase: ListGoalsUseCase;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  beforeEach(() => {
    goalRepo = createMockSebastianGoalRepo();
    useCase = new ListGoalsUseCase(goalRepo);
  });

  it('devrait retourner uniquement les objectifs actifs', async () => {
    const goals = [
      buildSebastianGoal({ isActive: true }),
      buildSebastianGoal({ id: 'goal-2', isActive: false }),
    ];
    goalRepo.findByUserId.mockResolvedValue(goals);

    const result = await useCase.execute('user-1');

    expect(goalRepo.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(true);
  });

  it('devrait retourner un tableau vide si aucun objectif actif', async () => {
    goalRepo.findByUserId.mockResolvedValue([
      buildSebastianGoal({ isActive: false }),
    ]);

    const result = await useCase.execute('user-1');
    expect(result).toEqual([]);
  });
});
