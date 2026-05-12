import { Inject, Injectable } from '@nestjs/common';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import { BudgetCategory } from '../../domain/BudgetCategory';
import type { IBudgetCategoryRepository } from '../../domain/IBudgetCategory.repository';
import type { IBudgetGroupRepository } from '../../domain/IBudgetGroup.repository';
import {
  BUDGET_CATEGORY_REPOSITORY,
  BUDGET_GROUP_REPOSITORY,
} from '../../domain/token';
import type { UpdateBudgetCategoryCommand } from '../dto/UpdateBudgetCategory.command';

/** Met a jour une categorie de budget (nom, couleur, icone, budgetLimit, etc.). */
@Injectable()
export class UpdateBudgetCategoryUseCase {
  constructor(
    @Inject(BUDGET_CATEGORY_REPOSITORY)
    private readonly categoryRepo: IBudgetCategoryRepository,
    @Inject(BUDGET_GROUP_REPOSITORY)
    private readonly groupRepo: IBudgetGroupRepository,
  ) {}

  /**
   * Execute la mise a jour partielle d'une categorie.
   *
   * Cas 1 — categorie per-group (`category.groupId != null`) : check
   * `isMember` puis update in place.
   *
   * Cas 2 — categorie par defaut (`category.groupId == null`) : exige
   * `command.groupId`. Si un clone existe deja pour ce groupe (via
   * `replaces_default_id`), on le met a jour. Sinon on cree un nouveau
   * clone qui herite des proprietes de la default + applique les
   * changements de la command (copy-on-write transparent pour le client).
   * Les categories par defaut restent immuables au sens absolu : on ne
   * modifie jamais une ligne avec `group_id IS NULL`.
   */
  async execute(command: UpdateBudgetCategoryCommand): Promise<BudgetCategory> {
    const category = await this.categoryRepo.findById(command.categoryId);
    if (!category) {
      throw new ResourceNotFoundError('Budget category not found');
    }

    const updateData: Partial<BudgetCategory> = {};
    if (command.name !== undefined) updateData.name = command.name;
    if (command.color !== undefined) updateData.color = command.color;
    if (command.icon !== undefined) updateData.icon = command.icon;
    if (command.budgetType !== undefined)
      updateData.budgetType = command.budgetType;
    if (command.budgetLimit !== undefined)
      updateData.budgetLimit = command.budgetLimit;

    if (category.groupId === null) {
      if (!command.groupId) {
        throw new InsufficientPermissionsError(
          'Impossible de modifier une categorie par defaut sans specifier groupId',
        );
      }

      const isMember = await this.groupRepo.isMember(
        command.groupId,
        command.userId,
      );
      if (!isMember) {
        throw new InsufficientPermissionsError(
          'User is not a member of this budget group',
        );
      }

      const existingClone = await this.categoryRepo.findCloneInGroup(
        command.groupId,
        category.id!,
      );
      if (existingClone) {
        return this.categoryRepo.update(existingClone.id!, updateData);
      }

      const clone = BudgetCategory.create({
        groupId: command.groupId,
        replacesDefaultId: category.id,
        name: updateData.name ?? category.name,
        color: updateData.color ?? category.color,
        icon: updateData.icon ?? category.icon,
        budgetType: updateData.budgetType ?? category.budgetType,
        budgetLimit: updateData.budgetLimit ?? category.budgetLimit,
        displayOrder: category.displayOrder,
      });
      return this.categoryRepo.create(clone);
    }

    const isMember = await this.groupRepo.isMember(
      category.groupId,
      command.userId,
    );
    if (!isMember) {
      throw new InsufficientPermissionsError(
        'User is not a member of this budget group',
      );
    }

    return this.categoryRepo.update(command.categoryId, updateData);
  }
}
