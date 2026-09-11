export const BOITES = [1, 2, 3] as const;

export type Boite = (typeof BOITES)[number];

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
    return 1;
  }
  return boite === 3 ? 3 : ((boite + 1) as Boite);
}

export function isDue(mastery: MasteryState): boolean {
  return (
    mastery.seancesDepuisDerniereVue >= SEANCES_AVANT_REVISION[mastery.boite]
  );
}
