import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import type { RecurringEntry } from '../../domain/RecurringEntry';
import type { IRecurringEntryRepository } from '../../domain/IRecurringEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  RECURRING_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';

/** Recupere les entrees recurrentes d'un groupe apres verification membership. */
@Injectable()
export class GetRecurringEntriesUseCase {
  constructor(
    @Inject(RECURRING_ENTRY_REPOSITORY)
    private readonly recurringRepo: IRecurringEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(groupId: string, userId: string): Promise<RecurringEntry[]> {
    const isMember = await this.groupRepo.isMember(groupId, userId);
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    return this.recurringRepo.findByGroupId(groupId);
  }
}
