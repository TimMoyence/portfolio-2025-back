/* eslint-disable @typescript-eslint/unbound-method */
import { GetBudgetGroupsUseCase } from './GetBudgetGroups.useCase';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  buildBudgetGroup,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';

describe('GetBudgetGroupsUseCase', () => {
  let useCase: GetBudgetGroupsUseCase;
  let groupRepo: jest.Mocked<IBudgetGroupRepository>;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetBudgetGroupsUseCase(groupRepo);
  });

  it("devrait retourner les groupes dont l'utilisateur est membre", async () => {
    const group = buildBudgetGroup();
    groupRepo.findByMemberId.mockResolvedValue([group]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([group]);
    expect(groupRepo.findByMemberId).toHaveBeenCalledWith('user-1');
  });

  it('devrait retourner un tableau vide si aucun groupe', async () => {
    groupRepo.findByMemberId.mockResolvedValue([]);

    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
    expect(groupRepo.findByMemberId).toHaveBeenCalledWith('user-1');
  });
});
