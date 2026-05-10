/* eslint-disable @typescript-eslint/unbound-method */
import { GetBudgetGroupMembersUseCase } from './GetBudgetGroupMembers.useCase';
import {
  buildBudgetMember,
  createMockBudgetGroupRepo,
} from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';

describe('GetBudgetGroupMembersUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let useCase: GetBudgetGroupMembersUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    useCase = new GetBudgetGroupMembersUseCase(groupRepo);
  });

  it('retourne les membres si user est member', async () => {
    groupRepo.isMember.mockResolvedValueOnce(true);
    groupRepo.findMembersWithUsers.mockResolvedValueOnce([
      buildBudgetMember({ userId: 'owner-id', isOwner: true }),
      buildBudgetMember({
        userId: 'invited-id',
        email: 'b@x.fr',
        isOwner: false,
      }),
    ]);

    const result = await useCase.execute({
      groupId: 'g1',
      userId: 'invited-id',
    });

    expect(groupRepo.isMember).toHaveBeenCalledWith('g1', 'invited-id');
    expect(groupRepo.findMembersWithUsers).toHaveBeenCalledWith('g1');
    expect(result).toHaveLength(2);
    expect(result[0].isOwner).toBe(true);
  });

  it('throw InsufficientPermissionsError si user non-member', async () => {
    groupRepo.isMember.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({ groupId: 'g1', userId: 'outsider' }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(groupRepo.findMembersWithUsers).not.toHaveBeenCalled();
  });
});
