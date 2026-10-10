const DECIMALES_DU_CENTIME = 2;
const DECIMALES_DU_MILLIONIEME = 6;

export function arrondi(valeur: number, decimales: number): number {
  return Number(valeur.toFixed(decimales));
}

export function auCentime(valeur: number): number {
  return arrondi(valeur, DECIMALES_DU_CENTIME);
}

export function auMillionieme(valeur: number): number {
  return arrondi(valeur, DECIMALES_DU_MILLIONIEME);
}
