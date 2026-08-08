import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { VALID_CATEGORIES, type SebastianCategory } from './SebastianEntry';

const VALID_GOAL_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type GoalPeriod = (typeof VALID_GOAL_PERIODS)[number];

export interface CreateSebastianGoalProps {
  userId: string;
  category: string;
  targetQuantity: number;
  period: string;
}

export interface SebastianGoalPersistenceProps {
  id: string;
  userId: string;
  category: string;
  targetQuantity: number;
  period: string;
  isActive: boolean;
  createdAt: Date;
}

export class SebastianGoal {
  id?: string;
  userId: string;
  category: SebastianCategory;
  targetQuantity: number;
  period: GoalPeriod;
  isActive: boolean;
  createdAt?: Date;

  static create(props: CreateSebastianGoalProps): SebastianGoal {
    const userId = props.userId?.trim();
    if (!userId) {
      throw new DomainValidationError(
        "L'identifiant utilisateur est obligatoire",
      );
    }

    if (!VALID_CATEGORIES.includes(props.category as SebastianCategory)) {
      throw new DomainValidationError(
        `Categorie invalide : ${props.category}. Valeurs acceptees : ${VALID_CATEGORIES.join(', ')}`,
      );
    }
    const category = props.category as SebastianCategory;

    if (typeof props.targetQuantity !== 'number' || props.targetQuantity <= 0) {
      throw new DomainValidationError(
        'La quantite cible doit etre un nombre strictement positif',
      );
    }

    if (!VALID_GOAL_PERIODS.includes(props.period as GoalPeriod)) {
      throw new DomainValidationError(
        `Periode invalide : ${props.period}. Valeurs acceptees : ${VALID_GOAL_PERIODS.join(', ')}`,
      );
    }
    const period = props.period as GoalPeriod;

    const goal = new SebastianGoal();
    goal.userId = userId;
    goal.category = category;
    goal.targetQuantity = props.targetQuantity;
    goal.period = period;
    goal.isActive = true;
    goal.createdAt = new Date();
    return goal;
  }

  static fromPersistence(props: SebastianGoalPersistenceProps): SebastianGoal {
    const goal = new SebastianGoal();
    goal.id = props.id;
    goal.userId = props.userId;
    goal.category = props.category as SebastianCategory;
    goal.targetQuantity = Number(props.targetQuantity);
    goal.period = props.period as GoalPeriod;
    goal.isActive = props.isActive;
    goal.createdAt = props.createdAt;
    return goal;
  }
}
