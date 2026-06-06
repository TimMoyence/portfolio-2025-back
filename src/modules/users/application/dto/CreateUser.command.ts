/** Commande pure pour la creation d'un utilisateur. */
export interface CreateUserCommand {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  roles?: string[];
  updatedOrCreatedBy?: string | null;
}

/** Resultat de la creation d'un utilisateur. */
export interface CreateUserResult {
  user: import('../../domain/User').User;
}
