/** Commande pure pour la creation d'un utilisateur. */
export interface CreateUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  updatedOrCreatedBy?: string | null;
}
