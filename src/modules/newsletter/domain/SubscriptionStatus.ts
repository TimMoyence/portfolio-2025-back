/**
 * Cycle de vie d'un abonnement newsletter. Le champ est indexable en
 * base pour permettre au scheduler drip de filtrer efficacement les
 * `confirmed` destinataires d'un pas de sequence.
 */
export const SUBSCRIPTION_STATUSES = [
  'pending',
  'confirmed',
  'unsubscribed',
  'bounced',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const isSubscriptionStatus = (
  value: unknown,
): value is SubscriptionStatus =>
  typeof value === 'string' &&
  (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
