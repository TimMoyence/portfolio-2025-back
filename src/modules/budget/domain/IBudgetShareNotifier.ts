/** Payload pour la notification de partage avec un compte existant. */
export interface BudgetShareNotificationPayload {
  targetEmail: string;
  targetFirstName: string;
  ownerFirstName: string;
  ownerLastName: string;
  groupName: string;
  budgetUrl: string;
}

/** Payload pour l'invitation envoyee a un email sans compte. */
export interface BudgetInvitationNotificationPayload {
  targetEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  groupName: string;
  inviteUrl: string;
  expiresAt: Date;
}

/** Port de notification pour le partage de budget. */
export interface IBudgetShareNotifier {
  sendBudgetShareNotification(
    payload: BudgetShareNotificationPayload,
  ): Promise<void>;

  sendBudgetInvitation(
    payload: BudgetInvitationNotificationPayload,
  ): Promise<void>;
}
