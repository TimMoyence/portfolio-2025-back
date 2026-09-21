export type Boite = 1 | 2 | 3;

export const BOITE_MIN: Boite = 1;
export const BOITE_MAX: Boite = 3;

export const SEANCES_AVANT_REVISION: Readonly<Record<Boite, number>> = {
  1: 1,
  2: 2,
  3: 5,
};

export interface MasteryState {
  boite: Boite;
  seancesDepuisDerniereVue: number;
}

export function nextBox(boite: Boite, reussi: boolean): Boite {
  if (!reussi) {
    return BOITE_MIN;
  }
  return Math.min(boite + 1, BOITE_MAX) as Boite;
}

export function isDue(mastery: MasteryState): boolean {
  return (
    mastery.seancesDepuisDerniereVue >= SEANCES_AVANT_REVISION[mastery.boite]
  );
}
