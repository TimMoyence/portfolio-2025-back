import type { TierValidationResult } from '../../src/modules/audit-requests/infrastructure/automation/report-quality-gate/tier-validators';

export function attendreRapportAccepte(result: TierValidationResult): void {
  expect(result.issues).toEqual([]);
  expect(result.valid).toBe(true);
  expect(result.shouldFallback).toBe(false);
}
