/** Commande pure pour la mise a jour d'un utilisateur. */
export interface UpdateUserCommand {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  roles?: string[];
  updatedOrCreatedBy?: string | null;
}
