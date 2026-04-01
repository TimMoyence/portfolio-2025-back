/** Commande pure pour definir un mot de passe sur un compte Google-only. */
export interface SetPasswordCommand {
  userId: string;
  newPassword: string;
  updatedOrCreatedBy?: string | null;
}
