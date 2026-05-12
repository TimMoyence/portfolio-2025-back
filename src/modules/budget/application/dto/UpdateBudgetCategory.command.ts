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
    /**
     * Requis uniquement quand la categorie ciblee est une categorie par
     * defaut (group_id IS NULL). Permet au use case de cloner la categorie
     * dans le groupe specifie au lieu de la modifier globalement.
     */
    public readonly groupId?: string,
  ) {}
}
