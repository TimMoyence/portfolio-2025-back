import type { BudgetMemberContribution } from './BudgetMemberContribution';

/** Port de persistance des contributions mensuelles par membre. */
export interface IBudgetMemberContributionRepository {
  /** Retourne les contributions d'un groupe pour un mois/annee donne. */
  findByGroupAndPeriod(
    groupId: string,
    month: number,
    year: number,
  ): Promise<BudgetMemberContribution[]>;

  /** Cree ou met a jour la contribution d'un user pour un mois/annee. */
  upsertForUser(input: {
    groupId: string;
    userId: string;
    month: number;
    year: number;
    monthlySalary: number;
  }): Promise<BudgetMemberContribution>;

  /** Retourne la derniere contribution d'un user dans un groupe avant un mois/annee donne. */
  findLastForUserBefore(
    groupId: string,
    userId: string,
    beforeMonth: number,
    beforeYear: number,
  ): Promise<BudgetMemberContribution | null>;
}
