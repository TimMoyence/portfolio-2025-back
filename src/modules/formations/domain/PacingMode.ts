import type { FreeRange } from './contrats/contrat-de-l-api';

export {
  PACING_MODES,
  type FreeRange,
  type PacingMode,
} from './contrats/contrat-de-l-api';

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
