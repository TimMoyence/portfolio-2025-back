/** Commande pure pour appliquer un nouveau mot de passe depuis un token. */
export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
}
