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
  /**
   * Token d'invitation budget magic-link (optionnel). Si fourni et que la
   * creation du compte reussit, le use case tente d'auto-accepter
   * l'invitation correspondante. Toute erreur d'acceptation est swallowed
   * et logguee : l'inscription reste valide meme si le token est invalide,
   * expire, revoque ou que l'email ne correspond pas.
   */
  inviteToken?: string;
}

/**
 * Resultat de la creation d'un utilisateur.
 *
 * `inviteWarning` est defini uniquement quand un `inviteToken` etait fourni
 * et que l'auto-acceptation a echoue avec une erreur metier connue
 * (`InvalidInvitationTokenError`, `InvitationEmailMismatchError`, etc.).
 * Les erreurs inattendues (techniques, base de donnees) sont re-throw.
 */
export interface CreateUserResult {
  user: import('../../domain/User').User;
  inviteWarning: { code: string; message: string } | null;
}
