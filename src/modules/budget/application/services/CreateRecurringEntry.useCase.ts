import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { RecurringEntry } from '../../domain/RecurringEntry';
import type { IRecurringEntryRepository } from '../../domain/IRecurringEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  RECURRING_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { CreateRecurringEntryCommand } from '../dto/CreateRecurringEntry.command';

/** Cree une entree recurrente apres verification de l'appartenance au groupe. */
@Injectable()
export class CreateRecurringEntryUseCase {
  constructor(
    @Inject(RECURRING_ENTRY_REPOSITORY)
    private readonly recurringRepo: IRecurringEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: CreateRecurringEntryCommand): Promise<RecurringEntry> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }
    const entry = RecurringEntry.create({
      groupId: command.groupId,
      createdByUserId: command.userId,
      categoryId: command.categoryId,
      description: command.description,
      amount: command.amount,
      type: command.type,
      frequency: command.frequency,
      dayOfMonth: command.dayOfMonth,
      dayOfWeek: command.dayOfWeek,
      startDate: command.startDate,
      endDate: command.endDate,
    });
    return this.recurringRepo.create(entry);
  }
}
