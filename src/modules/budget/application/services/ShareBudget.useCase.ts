import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';
import { USERS_REPOSITORY } from '../../../users/domain/token';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

/** Partage un groupe de budget avec un utilisateur identifie par email. */
@Injectable()
export class ShareBudgetUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
  ) {}

  async execute(
    command: ShareBudgetCommand,
  ): Promise<{ shared: true; userId: string }> {
    const group = await this.groupRepo.findById(command.groupId);
    if (!group) {
      throw new NotFoundException('Budget group not found');
    }
    if (group.ownerId !== command.userId) {
      throw new ForbiddenException('Only the group owner can share the budget');
    }
    const targetUser = await this.usersRepo.findByEmail(command.targetEmail);
    if (!targetUser || !targetUser.id) {
      throw new NotFoundException('Target user not found');
    }
    const alreadyMember = await this.groupRepo.isMember(
      command.groupId,
      targetUser.id,
    );
    if (!alreadyMember) {
      await this.groupRepo.addMember(command.groupId, targetUser.id);
    }
    return { shared: true, userId: targetUser.id };
  }
}
