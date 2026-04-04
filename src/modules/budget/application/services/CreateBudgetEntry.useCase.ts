import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { BudgetEntry } from '../../domain/BudgetEntry';
import type { IBudgetEntryRepository } from '../../domain/IBudgetEntry.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_ENTRY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { CreateBudgetEntryCommand } from '../dto/CreateBudgetEntry.command';

/** Cree une entree de budget apres verification de l'appartenance au groupe. */
@Injectable()
export class CreateBudgetEntryUseCase {
  constructor(
    @Inject(BUDGET_ENTRY_REPOSITORY)
    private readonly entryRepo: IBudgetEntryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: CreateBudgetEntryCommand): Promise<BudgetEntry> {
    const isMember = await this.groupRepo.isMember(
      command.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this budget group');
    }
    const entry = BudgetEntry.create({
      groupId: command.groupId,
      createdByUserId: command.userId,
      categoryId: command.categoryId,
      date: command.date,
      description: command.description,
      amount: command.amount,
      type: command.type,
      state: command.state,
    });
    return this.entryRepo.create(entry);
  }
}
