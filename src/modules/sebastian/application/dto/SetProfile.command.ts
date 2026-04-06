/** Commande pour definir le profil BAC d'un utilisateur. */
export interface SetProfileCommand {
  userId: string;
  weightKg: number;
  widmarkR: number;
}
