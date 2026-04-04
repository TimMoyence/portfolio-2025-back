import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import type { BudgetType } from './BudgetCategory';

const VALID_BUDGET_TYPES = ['FIXED', 'VARIABLE'] as const;
const VALID_FREQUENCIES = ['MONTHLY', 'WEEKLY', 'BIWEEKLY'] as const;

export type Frequency = (typeof VALID_FREQUENCIES)[number];

export interface CreateRecurringEntryProps {
  groupId: string;
  createdByUserId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: Date;
  endDate: Date | null;
}

/** Entite domaine representant une entree recurrente de budget. */
export class RecurringEntry {
  readonly id?: string;
  readonly groupId: string;
  readonly createdByUserId: string;
  readonly categoryId: string | null;
  readonly description: string;
  readonly amount: number;
  readonly type: BudgetType;
  readonly frequency: Frequency;
  readonly dayOfMonth: number | null;
  readonly dayOfWeek: number | null;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly isActive: boolean;
  readonly createdAt?: Date;

  static create(props: CreateRecurringEntryProps): RecurringEntry {
    const groupId = props.groupId?.trim();
    if (!groupId) {
      throw new DomainValidationError('Invalid recurring entry group');
    }

    const createdByUserId = props.createdByUserId?.trim();
    if (!createdByUserId) {
      throw new DomainValidationError('Invalid recurring entry creator');
    }

    const description = props.description?.trim();
    if (!description || description.length < 1) {
      throw new DomainValidationError('Invalid recurring entry description');
    }

    if (typeof props.amount !== 'number' || props.amount === 0) {
      throw new DomainValidationError(
        'Recurring entry amount must be non-zero',
      );
    }

    if (!VALID_BUDGET_TYPES.includes(props.type as BudgetType)) {
      throw new DomainValidationError('Invalid recurring entry type');
    }

    if (!VALID_FREQUENCIES.includes(props.frequency as Frequency)) {
      throw new DomainValidationError('Invalid recurring entry frequency');
    }

    const frequency = props.frequency as Frequency;

    if (frequency === 'MONTHLY') {
      if (
        props.dayOfMonth == null ||
        props.dayOfMonth < 1 ||
        props.dayOfMonth > 31
      ) {
        throw new DomainValidationError(
          'dayOfMonth is required for MONTHLY frequency (1-31)',
        );
      }
    }

    if (frequency === 'WEEKLY' || frequency === 'BIWEEKLY') {
      if (
        props.dayOfWeek == null ||
        props.dayOfWeek < 0 ||
        props.dayOfWeek > 6
      ) {
        throw new DomainValidationError(
          'dayOfWeek is required for WEEKLY/BIWEEKLY frequency (0-6)',
        );
      }
    }

    if (!props.startDate || isNaN(props.startDate.getTime())) {
      throw new DomainValidationError('Invalid recurring entry start date');
    }

    if (props.endDate) {
      if (isNaN(props.endDate.getTime())) {
        throw new DomainValidationError('Invalid recurring entry end date');
      }
      if (props.endDate < props.startDate) {
        throw new DomainValidationError(
          'End date must be after or equal to start date',
        );
      }
    }

    return Object.assign(new RecurringEntry(), {
      groupId,
      createdByUserId,
      categoryId: props.categoryId ?? null,
      description,
      amount: props.amount,
      type: props.type as BudgetType,
      frequency,
      dayOfMonth: props.dayOfMonth,
      dayOfWeek: props.dayOfWeek,
      startDate: props.startDate,
      endDate: props.endDate,
      isActive: true,
      createdAt: new Date(),
    });
  }
}
