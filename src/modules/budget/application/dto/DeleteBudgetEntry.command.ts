/** Commande pour supprimer une entree de budget. */
export class DeleteBudgetEntryCommand {
  constructor(
    public readonly userId: string,
    public readonly entryId: string,
  ) {}
}
