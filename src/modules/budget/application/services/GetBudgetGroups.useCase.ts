import { Inject, Injectable } from '@nestjs/common';
import type { BudgetGroup } from '../../domain/BudgetGroup';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';

/** Recupere tous les groupes de budget dont l'utilisateur est membre. */
@Injectable()
export class GetBudgetGroupsUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(userId: string): Promise<BudgetGroup[]> {
    return this.groupRepo.findByMemberId(userId);
  }
}
