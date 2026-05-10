/**
 * Commande d'acceptation d'une invitation magic-link de partage de budget.
 *
 * Le `tokenClear` est le token clair recu dans le mail d'invitation
 * (jamais persiste cote serveur — seul le hash SHA-256 l'est). Le use
 * case recalcule le hash a partir de cette valeur pour retrouver
 * l'invitation correspondante en base.
 */
export interface AcceptBudgetInvitationCommand {
  /** Token clair tel que recu dans le lien magic-link de l'invitation. */
  tokenClear: string;
  /** Identifiant de l'utilisateur connecte qui accepte l'invitation. */
  acceptedByUserId: string;
  /**
   * Email du compte qui accepte (apres login/register). Doit correspondre
   * a `targetEmail` de l'invitation (comparaison case-insensitive) sinon
   * `InvitationEmailMismatchError` est leve.
   */
  acceptedByEmail: string;
}

/**
 * Resultat de l'acceptation : identifiants du groupe rejoint, retournes
 * a l'API pour permettre au frontend de rediriger vers le bon budget.
 */
export interface AcceptBudgetInvitationResult {
  groupId: string;
  groupName: string;
}
