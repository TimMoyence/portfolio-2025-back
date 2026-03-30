/** Commande pure pour le changement de mot de passe. */
export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
  updatedOrCreatedBy?: string | null;
}
