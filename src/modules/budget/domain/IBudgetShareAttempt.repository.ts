/**
 * Port de persistance pour les tentatives de partage de budget.
 *
 * Sert au cooldown applicatif anti mail-bombing (CRIT-2 audit
 * 2026-05-09) : on ne re-envoie pas un email d'invitation pour la meme
 * paire (groupId, targetEmail) si une tentative a eu lieu dans la
 * fenetre de cooldown. Complete le `@Throttle` HTTP en couvrant les
 * scenarios cross-instance et les tentatives espacees au-dela du TTL
 * du throttler mais toujours indesirables.
 */
export interface IBudgetShareAttemptRepository {
  /**
   * Retourne la tentative la plus recente pour la paire
   * (groupId, targetEmail) survenue depuis `since`, ou `null` si aucune.
   */
  findRecent(
    groupId: string,
    targetEmail: string,
    since: Date,
  ): Promise<{ sentAt: Date } | null>;

  /** Persiste une nouvelle tentative reussie. */
  record(groupId: string, targetEmail: string, sentAt: Date): Promise<void>;
}
