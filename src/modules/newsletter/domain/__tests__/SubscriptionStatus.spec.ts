import {
  isSubscriptionStatus,
  SUBSCRIPTION_STATUSES,
} from '../SubscriptionStatus';

describe('isSubscriptionStatus', () => {
  it('valide tous les statuts de la liste', () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(isSubscriptionStatus(status)).toBe(true);
    }
  });

  it('rejette les valeurs inconnues et non-string', () => {
    expect(isSubscriptionStatus('actif')).toBe(false);
    expect(isSubscriptionStatus('')).toBe(false);
    expect(isSubscriptionStatus(null)).toBe(false);
    expect(isSubscriptionStatus(undefined)).toBe(false);
    expect(isSubscriptionStatus(42)).toBe(false);
  });
});
