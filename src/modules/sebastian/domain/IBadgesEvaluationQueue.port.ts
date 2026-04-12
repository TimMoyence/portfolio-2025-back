/**
 * Port de file d'attente pour l'evaluation des badges Sebastian.
 *
 * Decouple la couche application (AddEntryUseCase) de l'infrastructure
 * BullMQ. L'implementation BullMQ deduplique les appels rapproches via
 * un jobId base sur l'userId, ce qui previent les race conditions sur
 * la contrainte unique `(user_id, badge_key)`.
 */
export interface IBadgesEvaluationQueuePort {
  /**
   * Met en file une demande d'evaluation pour l'utilisateur donne.
   *
   * L'enqueue est idempotent : plusieurs appels rapproches pour le meme
   * userId seront deduplique par l'implementation. L'execution est
   * asynchrone et ne bloque pas l'appelant.
   */
  enqueue(userId: string): Promise<void>;
}
