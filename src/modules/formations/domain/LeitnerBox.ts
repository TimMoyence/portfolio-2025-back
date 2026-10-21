export const BOITES = Object.freeze([1, 2, 3] as const);
export type Boite = (typeof BOITES)[number];

export const BOITE_MIN: Boite = 1;
export const BOITE_MAX: Boite = 3;
