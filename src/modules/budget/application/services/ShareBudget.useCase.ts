import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import type { IBudgetShareNotifier } from '../../domain/IBudgetShareNotifier';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_SHARE_NOTIFIER,
} from '../../domain/token';
import { USERS_REPOSITORY } from '../../../users/domain/token';
import type { ShareBudgetCommand } from '../dto/ShareBudget.command';

/** Partage un groupe de budget avec un utilisateur identifie par email. */
@Injectable()
export class ShareBudgetUseCase {
  private readonly logger = new Logger(ShareBudgetUseCase.name);

  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(USERS_REPOSITORY) private readonly usersRepo: IUsersRepository,
    @Inject(BUDGET_SHARE_NOTIFIER)
    private readonly notifier: IBudgetShareNotifier,
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
      throw new NotFoundException(
        `Aucun compte trouve pour ${command.targetEmail}. L'utilisateur doit d'abord creer un compte avec cette adresse email.`,
      );
    }
    const alreadyMember = await this.groupRepo.isMember(
      command.groupId,
      targetUser.id,
    );
    if (!alreadyMember) {
      await this.groupRepo.addMember(command.groupId, targetUser.id);
    }

    // Send notification email
    const owner = await this.usersRepo.findById(command.userId);
    const budgetUrl = `${process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:4200'}/atelier/budget`;

    try {
      await this.notifier.sendBudgetShareNotification({
        targetEmail: command.targetEmail,
        targetFirstName: targetUser.firstName,
        ownerFirstName: owner?.firstName ?? 'Un utilisateur',
        ownerLastName: owner?.lastName ?? '',
        groupName: group.name,
        budgetUrl,
      });
    } catch (error) {
      this.logger.error(
        `Budget share email failed for ${command.targetEmail}: ${String(error)}`,
      );
    }

    return { shared: true, userId: targetUser.id };
  }
}
