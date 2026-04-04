/** Commande pour definir un objectif de consommation. */
export interface SetGoalCommand {
  userId: string;
  category: string;
  targetQuantity: number;
  period: string;
}
