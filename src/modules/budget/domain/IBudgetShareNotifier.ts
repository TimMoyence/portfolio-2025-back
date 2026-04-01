/** Payload pour la notification de partage de budget. */
export interface BudgetShareNotificationPayload {
  targetEmail: string;
  targetFirstName: string;
  ownerFirstName: string;
  ownerLastName: string;
  groupName: string;
  budgetUrl: string;
}

/** Port de notification pour le partage de budget. */
export interface IBudgetShareNotifier {
  sendBudgetShareNotification(
    payload: BudgetShareNotificationPayload,
  ): Promise<void>;
}
