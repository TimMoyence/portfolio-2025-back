import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { BudgetType } from './BudgetCategory';

const VALID_BUDGET_TYPES = ['FIXED', 'VARIABLE'] as const;

export interface CreateBudgetEntryProps {
  groupId: string;
  createdByUserId: string;
  categoryId?: string | null;
  date: string;
  description: string;
  amount: number;
  type: string;
  state?: string;
}

/** Entite domaine representant une entree (transaction) de budget. */
export class BudgetEntry {
  id?: string;
  groupId: string;
  createdByUserId: string;
  categoryId: string | null;
  date: Date;
  description: string;
  amount: number;
  type: BudgetType;
  state: string;
  createdAt?: Date;
  updatedAt?: Date;

  static create(props: CreateBudgetEntryProps): BudgetEntry {
    const groupId = props.groupId?.trim();
    if (!groupId) {
      throw new DomainValidationError('Invalid budget entry group');
    }

    const createdByUserId = props.createdByUserId?.trim();
    if (!createdByUserId) {
      throw new DomainValidationError('Invalid budget entry creator');
    }

    const description = props.description?.trim();
    if (!description || description.length < 1) {
      throw new DomainValidationError('Invalid budget entry description');
    }

    if (typeof props.amount !== 'number' || props.amount === 0) {
      throw new DomainValidationError('Budget entry amount must be non-zero');
    }

    const parsedDate = new Date(props.date);
    if (isNaN(parsedDate.getTime())) {
      throw new DomainValidationError('Invalid budget entry date');
    }

    if (!VALID_BUDGET_TYPES.includes(props.type as BudgetType)) {
      throw new DomainValidationError('Invalid budget entry type');
    }

    const entry = new BudgetEntry();
    entry.groupId = groupId;
    entry.createdByUserId = createdByUserId;
    entry.categoryId = props.categoryId ?? null;
    entry.date = parsedDate;
    entry.description = description;
    entry.amount = props.amount;
    entry.type = props.type as BudgetType;
    entry.state = props.state ?? 'COMPLETED';
    entry.createdAt = new Date();
    entry.updatedAt = new Date();
    return entry;
  }
}
