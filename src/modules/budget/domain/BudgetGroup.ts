import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';

export interface CreateBudgetGroupProps {
  name: string;
  ownerId: string;
}

/** Entite domaine representant un groupe de budget partage. */
export class BudgetGroup {
  id?: string;
  name: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;

  static create(props: CreateBudgetGroupProps): BudgetGroup {
    const name = props.name?.trim();
    if (!name || name.length < 1) {
      throw new DomainValidationError('Invalid budget group name');
    }

    const ownerId = props.ownerId?.trim();
    if (!ownerId || ownerId.length < 1) {
      throw new DomainValidationError('Invalid budget group owner');
    }

    const group = new BudgetGroup();
    group.name = name;
    group.ownerId = ownerId;
    group.createdAt = new Date();
    group.updatedAt = new Date();
    return group;
  }
}
