import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IRecurringEntryRepository } from '../../domain/IRecurringEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  RECURRING_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { DeleteRecurringEntryCommand } from '../dto/DeleteRecurringEntry.command';

/** Supprime une entree recurrente apres verification des droits. */
@Injectable()
export class DeleteRecurringEntryUseCase {
  constructor(
    @Inject(RECURRING_ENTRY_REPOSITORY)
    private readonly recurringRepo: IRecurringEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: DeleteRecurringEntryCommand): Promise<void> {
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

    await this.recurringRepo.delete(command.entryId);
  }
}
