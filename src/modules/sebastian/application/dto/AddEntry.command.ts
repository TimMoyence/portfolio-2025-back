/** Commande pour ajouter une entree de consommation. */
export interface AddEntryCommand {
  userId: string;
  category: string;
  quantity: number;
  date: string;
  notes?: string | null;
  drinkType?: string;
  alcoholDegree?: number | null;
  volumeCl?: number | null;
  /** Timestamp ISO 8601 optionnel de consommation. */
  consumedAt?: string;
}
