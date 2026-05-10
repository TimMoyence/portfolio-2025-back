import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { BudgetMember } from '../../domain/BudgetMember';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';

export interface GetBudgetGroupMembersQuery {
  groupId: string;
  userId: string;
}

/**
 * Liste les membres d'un groupe budget enrichis avec leurs infos user
 * (email, displayName, isOwner, joinedAt). Verifie que le demandeur est
 * membre avant de retourner la liste.
 */
@Injectable()
export class GetBudgetGroupMembersUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(query: GetBudgetGroupMembersQuery): Promise<BudgetMember[]> {
    const isMember = await this.groupRepo.isMember(query.groupId, query.userId);
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.groupRepo.findMembersWithUsers(query.groupId);
  }
}
