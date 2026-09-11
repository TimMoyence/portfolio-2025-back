export const PACING_MODES = ['pilote', 'libre'] as const;

export type PacingMode = (typeof PACING_MODES)[number];

export interface FreeRange {
  premier: number;
  dernier: number;
}

export function isFreeRangeValid(
  range: FreeRange,
  totalEcrans?: number,
): boolean {
  const borneHauteValide =
    totalEcrans === undefined || range.dernier < totalEcrans;
  return (
    Number.isInteger(range.premier) &&
    Number.isInteger(range.dernier) &&
    range.premier >= 0 &&
    range.dernier >= range.premier &&
    borneHauteValide
  );
}
