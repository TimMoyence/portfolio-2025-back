import { BudgetCategory } from '../../domain/BudgetCategory';

/** Mapper entre domaine BudgetCategory et representation externe. */
export class BudgetCategoryMapper {
  static toResponse(cat: BudgetCategory) {
    return {
      id: cat.id,
      groupId: cat.groupId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      budgetType: cat.budgetType,
      budgetLimit: Number(cat.budgetLimit),
      displayOrder: cat.displayOrder,
    };
  }
}
