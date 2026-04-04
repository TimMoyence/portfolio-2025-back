/** Commande pour mettre a jour une categorie de budget. */
export class UpdateBudgetCategoryCommand {
  constructor(
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly name?: string,
    public readonly color?: string,
    public readonly icon?: string,
    public readonly budgetType?: 'FIXED' | 'VARIABLE',
    public readonly budgetLimit?: number,
  ) {}
}
