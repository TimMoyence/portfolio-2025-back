import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { GetBudgetEntriesQuery } from '../dto/GetBudgetEntries.query';

/** Recupere les entrees de budget filtrees pour un membre du groupe. */
@Injectable()
export class GetBudgetEntriesUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(query: GetBudgetEntriesQuery): Promise<BudgetEntry[]> {
    const isMember = await this.groupRepo.isMember(query.groupId, query.userId);
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this budget group');
    }
    return this.entryRepo.findByFilters({
      groupId: query.groupId,
      month: query.month,
      year: query.year,
      categoryId: query.categoryId,
    });
  }
}
