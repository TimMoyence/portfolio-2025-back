import { Inject, Injectable } from '@nestjs/common';
import { BudgetGroup } from '../../domain/BudgetGroup';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import { BUDGET_GROUP_REPOSITORY } from '../../domain/token';
import type { CreateBudgetGroupCommand } from '../dto/CreateBudgetGroup.command';

/** Cree un nouveau groupe de budget ou retourne le groupe existant de l'utilisateur. */
@Injectable()
export class CreateBudgetGroupUseCase {
  constructor(
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  async execute(command: CreateBudgetGroupCommand): Promise<BudgetGroup> {
    const existing = await this.groupRepo.findByOwnerId(command.userId);
    if (existing.length > 0) {
      return existing[0];
    }

    const group = BudgetGroup.create({
      name: command.name,
      ownerId: command.userId,
    });
    return this.groupRepo.create(group);
  }
}
