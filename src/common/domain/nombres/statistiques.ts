import { estAuMoinsUn, mapperAuMoinsUn, type AuMoinsUn } from '../au-moins-un';

export function somme(valeurs: readonly number[]): number {
  return valeurs.reduce((total, valeur) => total + valeur, 0);
}

export function moyenne(valeurs: AuMoinsUn<number>): number {
  return somme(valeurs) / valeurs.length;
}

export function moyenneOu<R>(
  valeurs: readonly number[],
  siVide: R,
): number | R {
  return estAuMoinsUn(valeurs) ? moyenne(valeurs) : siVide;
}

export function proportion<T>(
  liste: AuMoinsUn<T>,
  retenir: (element: T) => boolean,
): number {
  return liste.filter(retenir).length / liste.length;
}

export function mediane(valeurs: AuMoinsUn<number>): number {
  const triees = [...valeurs].sort((gauche, droite) => gauche - droite);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 === 1
    ? triees[milieu]
    : (triees[milieu - 1] + triees[milieu]) / 2;
}

export function ecartTypePopulation(valeurs: AuMoinsUn<number>): number {
  const centre = moyenne(valeurs);
  return Math.sqrt(
    moyenne(mapperAuMoinsUn(valeurs, (valeur) => (valeur - centre) ** 2)),
  );
}
