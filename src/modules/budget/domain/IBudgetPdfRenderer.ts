import type { BudgetCategory } from './BudgetCategory';
import type { BudgetEntry } from './BudgetEntry';
import type { ExportBudgetPdfCommand } from '../application/dto/ExportBudgetPdf.command';

/**
 * Charge utile transmise au renderer PDF pour generer un export budget mensuel.
 *
 * Contient les donnees brutes (entries + categories) et le contexte de la commande
 * (groupId, mois, annee, instant de generation). Tous les calculs d'agregation
 * (totaux, ventilation par categorie) sont a la charge de l'adapter.
 */
export interface BudgetPdfPayload {
  readonly command: ExportBudgetPdfCommand;
  readonly entries: readonly BudgetEntry[];
  readonly categories: readonly BudgetCategory[];
  readonly generatedAt: Date;
}

/**
 * Port domaine pour la generation de PDF budget.
 *
 * L'application orchestre la recuperation des donnees et delegue le rendu
 * a un adapter d'infrastructure. Permet de remplacer pdfkit par toute autre
 * implementation (puppeteer, service externe, mock) sans toucher au use case.
 */
export interface IBudgetPdfRenderer {
  render(payload: BudgetPdfPayload): Promise<Buffer>;
}
