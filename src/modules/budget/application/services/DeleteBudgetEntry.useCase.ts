import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { DeleteBudgetEntryCommand } from '../dto/DeleteBudgetEntry.command';

/** Supprime une entree de budget apres verification des droits. */
@Injectable()
export class DeleteBudgetEntryUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  /** Execute la suppression d'une entree de budget. */
  async execute(command: DeleteBudgetEntryCommand): Promise<void> {
    const entry = await this.entryRepo.findById(command.entryId);
    if (!entry) {
      throw new ResourceNotFoundError('Budget entry not found');
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

    await this.entryRepo.delete(command.entryId);
  }
}
