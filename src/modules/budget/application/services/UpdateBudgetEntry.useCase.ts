import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { UpdateBudgetEntryCommand } from '../dto/UpdateBudgetEntry.command';

/** Met a jour la categorie d'une entree de budget. */
@Injectable()
export class UpdateBudgetEntryUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: UpdateBudgetEntryCommand): Promise<BudgetEntry> {
    const entry = await this.entryRepo.findById(command.entryId);
    if (!entry) {
      throw new NotFoundException('Budget entry not found');
    }

    const isMember = await this.groupRepo.isMember(
      entry.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this budget group');
    }

    return this.entryRepo.update(command.entryId, {
      categoryId: command.categoryId ?? null,
    });
  }
}
