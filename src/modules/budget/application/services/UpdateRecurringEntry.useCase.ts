import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { RecurringEntry } from '../../domain/RecurringEntry';
import type { IRecurringEntryRepository } from '../../domain/IRecurringEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  RECURRING_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { UpdateRecurringEntryCommand } from '../dto/UpdateRecurringEntry.command';

/** Met a jour une entree recurrente apres verification des droits. */
@Injectable()
export class UpdateRecurringEntryUseCase {
  constructor(
    @Inject(RECURRING_ENTRY_REPOSITORY)
    private readonly recurringRepo: IRecurringEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: UpdateRecurringEntryCommand): Promise<RecurringEntry> {
    const entry = await this.recurringRepo.findById(command.entryId);
    if (!entry) {
      throw new ResourceNotFoundError('Recurring entry not found');
    }

    const isMember = await this.groupRepo.isMember(
      entry.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    const {
      categoryId,
      description,
      amount,
      type,
      frequency,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
      isActive,
    } = command;
    return this.recurringRepo.update(command.entryId, {
      ...(categoryId !== undefined && { categoryId }),
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount }),
      ...(type !== undefined && { type }),
      ...(frequency !== undefined && { frequency }),
      ...(dayOfMonth !== undefined && { dayOfMonth }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(isActive !== undefined && { isActive }),
    });
  }
}
