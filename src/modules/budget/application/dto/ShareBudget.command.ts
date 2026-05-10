/**
 * Statut metier retourne par {@link ShareBudgetUseCase}.
 *
 * - `shared` : la cible avait deja un compte, elle a ete ajoutee au
 *   groupe et un mail "tu as ete ajoute" a ete envoye.
 * - `already-member` : la cible etait deja membre, retour idempotent
 *   silencieux (pas de mail, pas de mutation).
 * - `invited` : la cible n'avait pas de compte, une `BudgetInvitation`
 *   a ete creee et un mail magic-link a ete envoye.
 */
export type ShareBudgetStatus = 'shared' | 'already-member' | 'invited';

/** Resultat retourne par le use case de partage d'un budget. */
export interface ShareBudgetResult {
  status: ShareBudgetStatus;
}

export interface ShareBudgetCommand {
  userId: string;
  groupId: string;
  targetEmail: string;
}
