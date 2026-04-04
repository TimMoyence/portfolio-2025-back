import type { BudgetGroup } from './BudgetGroup';

/** Port de persistance pour les groupes de budget. */
export interface IBudgetGroupRepository {
  create(data: BudgetGroup): Promise<BudgetGroup>;
  findById(id: string): Promise<BudgetGroup | null>;
  findByOwnerId(userId: string): Promise<BudgetGroup[]>;
  findByMemberId(userId: string): Promise<BudgetGroup[]>;
  addMember(groupId: string, userId: string): Promise<void>;
  isMember(groupId: string, userId: string): Promise<boolean>;
}
