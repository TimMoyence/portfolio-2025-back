import { borner } from '../../../common/domain/nombres/borner';

const SCORE_MAXIMUM = 100;

export function scoreSur100(valeur: number): number {
  return Number.isFinite(valeur)
    ? borner(Math.round(valeur), 0, SCORE_MAXIMUM)
    : 0;
}
