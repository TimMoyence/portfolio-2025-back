import type { NewsletterSubscriber } from './NewsletterSubscriber';

/**
 * Port de planification de sequence drip. Appele lorsqu'un abonne
 * confirme son email : on planifie les N etapes en file d'attente
 * (implementee en BullMQ + Redis dans le sprint S1.5).
 *
 * Le domaine ignore volontairement la mecanique de queue : l'interface
 * expose uniquement la cadence metier (nombre d'etapes, delai ISO 8601,
 * identifiant de sequence selon la formation). L'infra concrete choisit
 * BullMQ / setTimeout / cron ; on peut swapper sans toucher au use-case.
 */
export interface IEmailDripScheduler {
  /**
   * Planifie la sequence drip associee a la formation d'inscription.
   * Le scheduler determine la mecanique concrete (jobs delayed BullMQ).
   * La methode doit etre idempotente — rejouer la meme inscription ne
   * duplique pas les emails.
   */
  schedule(subscriber: NewsletterSubscriber): Promise<void>;

  /**
   * Annule la sequence en cours pour un abonne (cas desabonnement ou
   * bounce). Idempotent : ne leve pas si aucune sequence n'est planifiee.
   */
  cancel(subscriber: NewsletterSubscriber): Promise<void>;
}
