/** Command DTO pour upsert d'une contribution mensuelle (cote application). */
export interface UpsertContributionCommand {
  groupId: string;
  month: number;
  year: number;
  monthlySalary: number;
  /** UserId du demandeur - la contribution est upsertee POUR ce userId, jamais un autre. */
  userId: string;
}
