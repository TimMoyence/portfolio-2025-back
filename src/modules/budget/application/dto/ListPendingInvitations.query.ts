/**
 * Query d'interrogation des invitations pending d'un groupe budget.
 *
 * `userId` est present pour valider que le demandeur est bien le owner
 * du groupe (controle de permission obligatoire avant le lookup pour
 * eviter toute fuite d'information sur l'existence des invitations).
 */
export interface ListPendingInvitationsQuery {
  /** Identifiant du groupe budget cible. */
  groupId: string;
  /** Identifiant de l'utilisateur demandeur (doit etre le owner). */
  userId: string;
}

/**
 * Vue projetee d'une invitation pending exposee aux interfaces.
 *
 * Ne contient ni le `tokenHash` (secret cote serveur) ni les champs
 * `acceptedAt` / `revokedAt` / `acceptedByUserId` (toujours null pour
 * une invitation pending) afin de minimiser la surface exposee.
 */
export interface PendingInvitationView {
  /** Identifiant unique de l'invitation. */
  id: string;
  /** Email cible de l'invitation (case preservee). */
  targetEmail: string;
  /** Date d'expiration absolue de l'invitation. */
  expiresAt: Date;
  /** Date de creation de l'invitation. */
  createdAt: Date;
}
