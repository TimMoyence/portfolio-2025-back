import type { BudgetGroup } from './BudgetGroup';
import type { BudgetMember } from './BudgetMember';

/** Port de persistance pour les groupes de budget. */
export interface IBudgetGroupRepository {
  create(data: BudgetGroup): Promise<BudgetGroup>;
  findById(id: string): Promise<BudgetGroup | null>;
  findByOwnerId(userId: string): Promise<BudgetGroup[]>;
  findByMemberId(userId: string): Promise<BudgetGroup[]>;
  addMember(groupId: string, userId: string): Promise<void>;
  isMember(groupId: string, userId: string): Promise<boolean>;

  /** Retourne true si userId est l'owner du groupe, false sinon (group inexistant inclus). */
  isOwner(groupId: string, userId: string): Promise<boolean>;

  /** Liste les membres d'un groupe enrichis avec email/displayName/isOwner/joinedAt. Owner d'abord. */
  findMembersWithUsers(groupId: string): Promise<BudgetMember[]>;

  /** Retire un membre du groupe. Idempotent : ne throw pas si la ligne est absente. */
  removeMember(groupId: string, userId: string): Promise<void>;
}
