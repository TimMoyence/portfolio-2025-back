import { estEntierPositif } from '../../../common/domain/nombres/est-entier-positif';
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
    estEntierPositif(range.premier) &&
    estEntierPositif(range.dernier) &&
    range.dernier >= range.premier &&
    borneHauteValide
  );
}
