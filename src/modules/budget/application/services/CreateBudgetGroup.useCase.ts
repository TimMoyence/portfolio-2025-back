import { Inject, Injectable } from '@nestjs/common';
import { BudgetGroup } from '../../domain/BudgetGroup';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';
import type { CreateBudgetGroupCommand } from '../dto/CreateBudgetGroup.command';

/** Cree un nouveau groupe de budget et ajoute le createur comme membre. */
@Injectable()
export class CreateBudgetGroupUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: CreateBudgetGroupCommand): Promise<BudgetGroup> {
    const group = BudgetGroup.create({
      name: command.name,
      ownerId: command.userId,
    });
    return this.groupRepo.create(group);
  }
}
