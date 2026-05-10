import type { BudgetInvitation } from './BudgetInvitation';

/**
 * Port de persistance des invitations de partage de budget.
 *
 * "Active" dans `findActiveByGroupAndEmail` = `accepted_at IS NULL
 * AND revoked_at IS NULL` (inclut les invitations expirees, qui doivent
 * etre revoquees pour pouvoir en creer une nouvelle — la contrainte
 * unique partielle de la table interdit deux lignes actives sur la
 * meme paire (groupId, targetEmail)).
 */
export interface IBudgetInvitationRepository {
  /** Cree une nouvelle invitation et retourne l'entite persistee. */
  create(invitation: {
    groupId: string;
    inviterUserId: string;
    targetEmail: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<BudgetInvitation>;

  /** Retourne l'invitation associee au hash de token, ou null. */
  findByTokenHash(tokenHash: string): Promise<BudgetInvitation | null>;

  /**
   * Retourne l'invitation active (non acceptee, non revoquee) pour la
   * paire (groupId, targetEmail). Inclut les invitations expirees.
   */
  findActiveByGroupAndEmail(
    groupId: string,
    targetEmail: string,
  ): Promise<BudgetInvitation | null>;

  /**
   * Liste les invitations en attente (non consommees, non revoquees,
   * non expirees) pour un groupe, ordre desc sur createdAt.
   */
  findPendingByGroup(groupId: string, now: Date): Promise<BudgetInvitation[]>;

  /** Marque une invitation comme acceptee par un user a une date. */
  markAccepted(
    invitationId: string,
    acceptedByUserId: string,
    acceptedAt: Date,
  ): Promise<void>;

  /** Marque une invitation comme revoquee. */
  markRevoked(invitationId: string, revokedAt: Date): Promise<void>;
}
