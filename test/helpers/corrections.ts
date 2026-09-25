interface CorrectionObservee {
  readonly verdicts: readonly { readonly juste: boolean }[];
  readonly score: number;
  readonly correcte: boolean;
}

export function attendreProductionReussie(
  correction: CorrectionObservee,
  verdicts: number,
): void {
  expect(correction.verdicts).toHaveLength(verdicts);
  expect(correction.verdicts.filter((verdict) => !verdict.juste)).toEqual([]);
  expect(correction.score).toBe(1);
  expect(correction.correcte).toBe(true);
}
