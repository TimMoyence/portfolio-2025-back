import type { TierValidationResult } from '../../src/modules/audit-requests/infrastructure/automation/report-quality-gate/tier-validators';

export function attendreRapportAccepte(result: TierValidationResult): void {
  expect(result.issues).toEqual([]);
  expect(result.valid).toBe(true);
}

export function attendreRapportRefuse(
  result: TierValidationResult,
  motif: string,
): void {
  expect(result.issues).toEqual([motif]);
  expect(result.valid).toBe(false);
}
