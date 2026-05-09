import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { InvalidInputError } from '../../../common/domain/errors/InvalidInputError';

const VALID_KINDS = ['SAVINGS', 'SPENDING_LIMIT', 'CATEGORY_LIMIT'] as const;

export type BudgetGoalKind = (typeof VALID_KINDS)[number];

export interface CreateBudgetGoalProps {
  id?: string;
  groupId: string;
  createdByUserId: string;
  name: string;
  kind: BudgetGoalKind;
  targetAmount: number;
  categoryId: string | null;
  deadline: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Entite domaine representant un objectif de budget (epargne, plafond, plafond par categorie). */
export class BudgetGoal {
  readonly id?: string;
  readonly groupId!: string;
  readonly createdByUserId!: string;
  readonly name!: string;
  readonly kind!: BudgetGoalKind;
  readonly targetAmount!: number;
  readonly categoryId!: string | null;
  readonly deadline!: Date | null;
  readonly isActive!: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  static create(props: CreateBudgetGoalProps): BudgetGoal {
    const groupId = props.groupId?.trim();
    if (!groupId) {
      throw new DomainValidationError('Invalid budget goal group');
    }

    const createdByUserId = props.createdByUserId?.trim();
    if (!createdByUserId) {
      throw new DomainValidationError('Invalid budget goal creator');
    }

    const name = props.name?.trim();
    if (!name || name.length > 120) {
      throw new DomainValidationError('Invalid budget goal name');
    }

    if (!VALID_KINDS.includes(props.kind)) {
      throw new DomainValidationError('Invalid budget goal kind');
    }

    if (
      typeof props.targetAmount !== 'number' ||
      !Number.isFinite(props.targetAmount) ||
      props.targetAmount < 0
    ) {
      throw new DomainValidationError(
        'Budget goal target amount must be a finite non-negative number',
      );
    }

    if (props.deadline !== null) {
      if (
        !(props.deadline instanceof Date) ||
        isNaN(props.deadline.getTime())
      ) {
        throw new DomainValidationError('Invalid budget goal deadline');
      }
    }

    if (props.kind === 'CATEGORY_LIMIT' && props.categoryId == null) {
      throw new InvalidInputError(
        'categoryId is required for CATEGORY_LIMIT goals',
      );
    }

    const now = new Date();

    return Object.assign(new BudgetGoal(), {
      id: props.id,
      groupId,
      createdByUserId,
      name,
      kind: props.kind,
      targetAmount: props.targetAmount,
      categoryId: props.categoryId,
      deadline: props.deadline,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }
}

export interface BudgetGoalWithProgress extends BudgetGoal {
  readonly currentAmount: number;
  readonly progressPercent: number;
}

/** Calcule la progression d'un objectif a partir de son montant courant. */
export function withProgress(
  goal: BudgetGoal,
  currentAmount: number,
): BudgetGoalWithProgress {
  let progressPercent: number;
  if (goal.targetAmount === 0) {
    progressPercent = 0;
  } else {
    const pct = (currentAmount / goal.targetAmount) * 100;
    progressPercent = Math.max(0, Math.min(100, pct));
  }

  return Object.assign(new BudgetGoal(), goal, {
    currentAmount,
    progressPercent,
  }) as BudgetGoalWithProgress;
}
