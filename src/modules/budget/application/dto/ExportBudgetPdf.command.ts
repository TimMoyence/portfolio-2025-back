/**
 * Commande pour l'export PDF d'un budget mensuel.
 *
 * Contient l'identifiant utilisateur, le groupe et la periode souhaitee.
 */
export class ExportBudgetPdfCommand {
  constructor(
    public readonly userId: string,
    public readonly groupId: string,
    public readonly month: number,
    public readonly year: number,
  ) {}
}
