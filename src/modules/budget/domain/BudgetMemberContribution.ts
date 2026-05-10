import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export interface CreateBudgetMemberContributionProps {
  id?: string;
  groupId: string;
  userId: string;
  month: number;
  year: number;
  monthlySalary: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Entite domaine representant la contribution mensuelle d'un membre a un budget partage. */
export class BudgetMemberContribution {
  id?: string;
  groupId: string;
  userId: string;
  month: number;
  year: number;
  monthlySalary: number;
  createdAt: Date;
  updatedAt: Date;

  static create(
    props: CreateBudgetMemberContributionProps,
  ): BudgetMemberContribution {
    const groupId = props.groupId?.trim();
    if (!groupId) {
      throw new DomainValidationError(
        'Invalid budget member contribution group',
      );
    }

    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        'Invalid budget member contribution user',
      );
    }

    if (
      typeof props.monthlySalary !== 'number' ||
      !Number.isFinite(props.monthlySalary) ||
      props.monthlySalary < 0
    ) {
      throw new DomainValidationError(
        'Budget member contribution monthly salary must be a finite non-negative number',
      );
    }

    if (
      typeof props.month !== 'number' ||
      !Number.isInteger(props.month) ||
      props.month < 1 ||
      props.month > 12
    ) {
      throw new DomainValidationError(
        'Budget member contribution month must be an integer between 1 and 12',
      );
    }

    if (
      typeof props.year !== 'number' ||
      !Number.isInteger(props.year) ||
      props.year < 2000 ||
      props.year > 2100
    ) {
      throw new DomainValidationError(
        'Budget member contribution year must be an integer between 2000 and 2100',
      );
    }

    const contribution = new BudgetMemberContribution();
    contribution.id = props.id;
    contribution.groupId = groupId;
    contribution.userId = userId;
    contribution.month = props.month;
    contribution.year = props.year;
    contribution.monthlySalary = props.monthlySalary;
    contribution.createdAt = props.createdAt ?? new Date();
    contribution.updatedAt = props.updatedAt ?? new Date();
    return contribution;
  }
}
