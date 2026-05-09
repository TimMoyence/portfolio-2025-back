import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

export interface GetBudgetEntriesMonthsQuery {
  groupId: string;
  userId: string;
}

/**
 * Liste les couples (month, year) distincts ou des entrees existent pour
 * un groupe, ordonnes du plus recent au plus ancien. Sert au front pour
 * generer le selecteur de mois sans charger toutes les entrees.
 */
@Injectable()
export class GetBudgetEntriesMonthsUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
  ) {}

  async execute(
    query: GetBudgetEntriesMonthsQuery,
  ): Promise<Array<{ month: number; year: number }>> {
    const isMember = await this.groupRepo.isMember(query.groupId, query.userId);
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.entryRepo.findDistinctMonths(query.groupId);
  }
}
