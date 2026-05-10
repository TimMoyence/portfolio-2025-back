/* eslint-disable @typescript-eslint/unbound-method */
import { RemoveBudgetGroupMemberUseCase } from './RemoveBudgetGroupMember.useCase';
import { createMockBudgetGroupRepo } from '../../../../../test/factories/budget.factory';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../../../common/domain/errors/InvalidInputError';

describe('RemoveBudgetGroupMemberUseCase', () => {
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;
  let useCase: RemoveBudgetGroupMemberUseCase;

  beforeEach(() => {
    groupRepo = createMockBudgetGroupRepo();
    useCase = new RemoveBudgetGroupMemberUseCase(groupRepo);
  });

  it('owner retire un autre membre', async () => {
    groupRepo.isOwner
      .mockResolvedValueOnce(true) // actor is owner
      .mockResolvedValueOnce(false); // target is NOT owner
    groupRepo.removeMember.mockResolvedValueOnce();

    await useCase.execute({
      groupId: 'g1',
      actorUserId: 'owner',
      targetUserId: 'target',
    });

    expect(groupRepo.isOwner).toHaveBeenNthCalledWith(1, 'g1', 'owner');
    expect(groupRepo.isOwner).toHaveBeenNthCalledWith(2, 'g1', 'target');
    expect(groupRepo.removeMember).toHaveBeenCalledWith('g1', 'target');
  });

  it('throw InsufficientPermissionsError si actor non-owner', async () => {
    groupRepo.isOwner.mockResolvedValueOnce(false);
    await expect(
      useCase.execute({
        groupId: 'g1',
        actorUserId: 'u-x',
        targetUserId: 'u-y',
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(groupRepo.removeMember).not.toHaveBeenCalled();
  });

  it('throw InvalidInputError si actor tente de se retirer lui-meme (= owner)', async () => {
    groupRepo.isOwner.mockResolvedValueOnce(true); // actor is owner
    await expect(
      useCase.execute({
        groupId: 'g1',
        actorUserId: 'owner',
        targetUserId: 'owner',
      }),
    ).rejects.toBeInstanceOf(InvalidInputError);
    expect(groupRepo.removeMember).not.toHaveBeenCalled();
  });

  it('throw InvalidInputError si target est owner (defense en profondeur)', async () => {
    groupRepo.isOwner
      .mockResolvedValueOnce(true) // actor is owner
      .mockResolvedValueOnce(true); // target ALSO owner (cas impossible mais ceinture)
    await expect(
      useCase.execute({
        groupId: 'g1',
        actorUserId: 'owner-1',
        targetUserId: 'owner-2',
      }),
    ).rejects.toBeInstanceOf(InvalidInputError);
    expect(groupRepo.removeMember).not.toHaveBeenCalled();
  });
});
