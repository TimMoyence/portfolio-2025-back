/** Commande pure pour la mise a jour du profil utilisateur (self-update). */
export interface UpdateProfileCommand {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}
