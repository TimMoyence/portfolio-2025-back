import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { BudgetMemberContribution } from '../../domain/BudgetMemberContribution';
import type { IBudgetMemberContributionRepository } from '../../domain/IBudgetMemberContribution.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_MEMBER_CONTRIBUTION_REPOSITORY,
} from '../../domain/token';

export interface GetBudgetContributionsQuery {
  groupId: string;
  month: number;
  year: number;
  userId: string;
}

/**
 * Recupere les contributions mensuelles de tous les membres d'un groupe pour
 * un mois/annee donne. Verifie l'appartenance du demandeur au groupe avant
 * de retourner les donnees (transparence totale entre membres).
 */
@Injectable()
export class GetBudgetContributionsUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_MEMBER_CONTRIBUTION_REPOSITORY)
    private readonly contribRepo: IBudgetMemberContributionRepository,
  ) {}

  async execute(
    query: GetBudgetContributionsQuery,
  ): Promise<BudgetMemberContribution[]> {
    const isMember = await this.groupRepo.isMember(query.groupId, query.userId);
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.contribRepo.findByGroupAndPeriod(
      query.groupId,
      query.month,
      query.year,
    );
  }
}
