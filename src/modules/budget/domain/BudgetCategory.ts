import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

const VALID_BUDGET_TYPES = ['FIXED', 'VARIABLE'] as const;
export type BudgetType = (typeof VALID_BUDGET_TYPES)[number];

export interface CreateBudgetCategoryProps {
  name: string;
  groupId: string | null;
  color?: string;
  icon?: string;
  budgetType: string;
  budgetLimit?: number;
  displayOrder?: number;
}

/** Entite domaine representant une categorie de budget. */
export class BudgetCategory {
  id?: string;
  groupId: string | null;
  name: string;
  color: string;
  icon: string;
  budgetType: BudgetType;
  budgetLimit: number;
  displayOrder: number;
  createdAt?: Date;

  static create(props: CreateBudgetCategoryProps): BudgetCategory {
    const name = props.name?.trim();
    if (!name || name.length < 1) {
      throw new DomainValidationError('Invalid budget category name');
    }

    if (!VALID_BUDGET_TYPES.includes(props.budgetType as BudgetType)) {
      throw new DomainValidationError(
        'Invalid budget type, must be FIXED or VARIABLE',
      );
    }

    const budgetLimit = props.budgetLimit ?? 0;
    if (budgetLimit < 0) {
      throw new DomainValidationError('Budget limit must be >= 0');
    }

    const cat = new BudgetCategory();
    cat.groupId = props.groupId;
    cat.name = name;
    cat.color = props.color ?? '#6B7280';
    cat.icon = props.icon ?? 'tag';
    cat.budgetType = props.budgetType as BudgetType;
    cat.budgetLimit = budgetLimit;
    cat.displayOrder = props.displayOrder ?? 0;
    cat.createdAt = new Date();
    return cat;
  }
}
