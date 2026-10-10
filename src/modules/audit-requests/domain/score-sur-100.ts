import { borner } from '../../../common/domain/nombres/borner';
import { moyenneOu } from '../../../common/domain/nombres/statistiques';

const SCORE_MAXIMUM = 100;

export function scoreSur100(valeur: number): number {
  return Number.isFinite(valeur)
    ? borner(Math.round(valeur), 0, SCORE_MAXIMUM)
    : 0;
}

export function scoreMoyenSur100(scores: readonly number[]): number {
  return scoreSur100(moyenneOu(scores, 0));
}
