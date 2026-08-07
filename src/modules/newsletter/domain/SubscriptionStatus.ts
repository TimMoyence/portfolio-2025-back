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
