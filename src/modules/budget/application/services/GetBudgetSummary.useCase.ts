import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

export interface BudgetSummaryResult {
  totalExpenses: number;
  totalIncoming: number;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    total: number;
    budgetLimit: number;
    remaining: number;
  }>;
}

/** Calcule le resume mensuel du budget par categorie. */
@Injectable()
export class GetBudgetSummaryUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(params: {
    userId: string;
    groupId: string;
    month: number;
    year: number;
  }): Promise<BudgetSummaryResult> {
    const isMember = await this.groupRepo.isMember(
      params.groupId,
      params.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    const [entries, categories] = await Promise.all([
      this.entryRepo.findByFilters({
        groupId: params.groupId,
        month: params.month,
        year: params.year,
      }),
      this.categoryRepo.findByGroupId(params.groupId),
    ]);

    const totalExpenses = entries
      .filter((e) => Number(e.amount) < 0)
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
    const totalIncoming = entries
      .filter((e) => Number(e.amount) > 0)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const totals = new Map<string | null, number>();

    for (const entry of entries) {
      if (Number(entry.amount) >= 0) continue;
      const key = entry.categoryId ?? null;
      totals.set(key, (totals.get(key) ?? 0) + Math.abs(Number(entry.amount)));
    }

    const byCategory = Array.from(totals.entries()).map(([catId, total]) => {
      const cat = catId ? catMap.get(catId) : undefined;
      const budgetLimit = cat ? Number(cat.budgetLimit) : 0;
      return {
        categoryId: catId,
        categoryName: cat?.name ?? 'Sans categorie',
        total,
        budgetLimit,
        remaining: budgetLimit - total,
      };
    });

    return { totalExpenses, totalIncoming, byCategory };
  }
}
