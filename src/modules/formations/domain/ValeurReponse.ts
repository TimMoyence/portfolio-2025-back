import type { ValeurProduction, ValeurReponse } from './contrats/resultats';

export function estUneProduction(
  valeur: ValeurReponse,
): valeur is ValeurProduction {
  return typeof valeur === 'object';
}

export function texteDeValeur(valeur: ValeurReponse): string {
  return estUneProduction(valeur) ? valeur.type : String(valeur);
}
