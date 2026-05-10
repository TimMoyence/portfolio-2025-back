import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { BudgetMemberContribution } from '../../domain/BudgetMemberContribution';
import type { IBudgetMemberContributionRepository } from '../../domain/IBudgetMemberContribution.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_MEMBER_CONTRIBUTION_REPOSITORY,
} from '../../domain/token';
import type { UpsertContributionCommand } from '../dto/UpsertContribution.command';

/**
 * Upsert la contribution mensuelle d'un membre POUR LUI-MEME (le userId
 * est celui du demandeur, jamais celui d'un autre - invariant impose
 * par construction de l'API : pas de parametre target userId).
 */
@Injectable()
export class UpsertMyBudgetContributionUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_MEMBER_CONTRIBUTION_REPOSITORY)
    private readonly contribRepo: IBudgetMemberContributionRepository,
  ) {}

  async execute(
    command: UpsertContributionCommand,
  ): Promise<BudgetMemberContribution> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.contribRepo.upsertForUser({
      groupId: command.groupId,
      userId: command.userId,
      month: command.month,
      year: command.year,
      monthlySalary: command.monthlySalary,
    });
  }
}
