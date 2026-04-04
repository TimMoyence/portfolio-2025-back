/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import { SetGoalUseCase } from './SetGoal.useCase';
import {
  buildSebastianGoal,
  createMockSebastianGoalRepo,
} from '../../../../../test/factories/sebastian.factory';

describe('SetGoalUseCase', () => {
  let useCase: SetGoalUseCase;
  let goalRepo: ReturnType<typeof createMockSebastianGoalRepo>;

  beforeEach(() => {
    goalRepo = createMockSebastianGoalRepo();
    useCase = new SetGoalUseCase(goalRepo);
  });

  it('devrait creer un objectif via le domaine et le repository', async () => {
    const goal = buildSebastianGoal();
    goalRepo.create.mockResolvedValue(goal);

    const result = await useCase.execute({
      userId: 'user-1',
      category: 'coffee',
      targetQuantity: 3,
      period: 'daily',
    });

    expect(goalRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(goal);
  });

  it('devrait propager les erreurs de validation du domaine', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        category: 'invalid',
        targetQuantity: 3,
        period: 'daily',
      }),
    ).rejects.toThrow(DomainValidationError);
  });
});
