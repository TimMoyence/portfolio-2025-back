import type { FreeRange } from 'portfolio-2025-partage/contrats';

export {
  PACING_MODES,
  type FreeRange,
  type PacingMode,
} from 'portfolio-2025-partage/contrats';

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
