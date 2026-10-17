const DECIMALES_DU_CENTIME = 2;
const DECIMALES_DU_MILLIONIEME = 6;
const CHIFFRES_SIGNIFICATIFS = 15;

export function sansZeroNegatif(valeur: number): number {
  return valeur === 0 ? 0 : valeur;
}

export function arrondi(valeur: number, decimales: number): number {
  const facteur = 10 ** Math.trunc(decimales);
  const decale = Number(
    (Math.abs(valeur) * facteur).toPrecision(CHIFFRES_SIGNIFICATIFS),
  );
  const arrondie = (Math.sign(valeur) * Math.round(decale)) / facteur;
  return sansZeroNegatif(Number(arrondie.toPrecision(CHIFFRES_SIGNIFICATIFS)));
}

export function auCentime(valeur: number): number {
  return arrondi(valeur, DECIMALES_DU_CENTIME);
}

export function auMillionieme(valeur: number): number {
  return arrondi(valeur, DECIMALES_DU_MILLIONIEME);
}
