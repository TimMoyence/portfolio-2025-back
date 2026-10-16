import { sansEspacesTypographiques } from '../texte/sans-espaces-typographiques';

export const VALEUR_ABSENTE = '—';

export function nombreAffiche(
  valeur: number | null,
  decimales: number,
  decimalesMin = 0,
): string {
  return valeur === null
    ? VALEUR_ABSENTE
    : new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimalesMin,
        maximumFractionDigits: decimales,
        signDisplay: 'negative',
      }).format(valeur);
}

export function nombreFrancais(valeur: number, decimales: number): string {
  return sansEspacesTypographiques(nombreAffiche(valeur, decimales, decimales));
}

export function avecVirgule(valeur: number, decimales?: number): string {
  const ecrite =
    decimales === undefined ? String(valeur) : valeur.toFixed(decimales);
  return ecrite.replace('.', ',');
}
