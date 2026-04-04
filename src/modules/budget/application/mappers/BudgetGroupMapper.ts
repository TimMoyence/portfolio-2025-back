import { BudgetGroup } from '../../domain/BudgetGroup';

/** Mapper entre domaine BudgetGroup et representation externe. */
export class BudgetGroupMapper {
  static toResponse(group: BudgetGroup) {
    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      createdAt: group.createdAt?.toISOString(),
    };
  }
}
