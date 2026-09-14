export type Rng = () => number;

export interface Tirage {
  entier(min: number, max: number): number;
  decimal(min: number, max: number, pas: number): number;
  choix<T>(valeurs: readonly [T, ...T[]]): T;
}

const INCREMENT = 0x6d2b79f5;
const ECHELLE = 4294967296;
const PRECISION = 1e10;

export function creerRng(graine: number): Rng {
  let etat = graine | 0;
  return () => {
    etat = (etat + INCREMENT) | 0;
    let melange = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    melange =
      (melange + Math.imul(melange ^ (melange >>> 7), 61 | melange)) ^ melange;
    return ((melange ^ (melange >>> 14)) >>> 0) / ECHELLE;
  };
}

export function melanger<T>(elements: readonly T[], rng: Rng): T[] {
  const copie = [...elements];
  for (let index = copie.length - 1; index > 0; index -= 1) {
    const cible = Math.floor(rng() * (index + 1));
    [copie[index], copie[cible]] = [copie[cible], copie[index]];
  }
  return copie;
}

export function creerTirage(rng: Rng): Tirage {
  const entier = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(
        `Bornes de tirage entier invalides : ${min}..${max}`,
      );
    }
    return min + Math.floor(rng() * (max - min + 1));
  };
  return {
    entier,
    decimal(min, max, pas) {
      if (pas <= 0 || max < min) {
        throw new RangeError(
          `Tirage decimal invalide : ${min}..${max} pas ${pas}`,
        );
      }
      const rangMax = Math.floor((max - min) / pas + 1e-9);
      return (
        Math.round((min + pas * entier(0, rangMax)) * PRECISION) / PRECISION
      );
    },
    choix(valeurs) {
      return valeurs[entier(0, valeurs.length - 1)];
    },
  };
}
