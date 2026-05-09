/** Vue lecture d'un membre d'un groupe budget enrichi avec ses infos user. */
export interface BudgetMember {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string;
  readonly isOwner: boolean;
  readonly joinedAt: Date;
}
