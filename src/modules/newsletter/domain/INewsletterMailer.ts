import type { NewsletterSubscriber } from './NewsletterSubscriber';

/**
 * Port d'envoi d'emails newsletter. Trois messages cles :
 *  - confirmation (J0) — email de double opt-in contenant le magic link,
 *  - welcome (post-confirmation) — email de bienvenue avec lien vers la
 *    ressource promise,
 *  - unsubscribeAck — accuse de desabonnement.
 *
 * Les messages drip (J+n) sont servis par un autre port
 * (`IEmailDripScheduler`) car leur cadence est asynchrone et file
 * d'attente (S1.5). Garder les deux ports distincts evite de melanger
 * les responsabilites.
 */
export interface INewsletterMailer {
  sendConfirmation(subscriber: NewsletterSubscriber): Promise<void>;
  sendWelcome(subscriber: NewsletterSubscriber): Promise<void>;
  sendUnsubscribeAck(subscriber: NewsletterSubscriber): Promise<void>;
}
