import { sansEspacesTypographiques } from '../texte/sans-espaces-typographiques';

export const VALEUR_ABSENTE = '—';

export const TOUTES_LES_DECIMALES = 20;

function ecritEnFrancais(
  valeur: number,
  options: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat('fr-FR', {
    signDisplay: 'negative',
    ...options,
  }).format(valeur);
}

export function nombreAffiche(
  valeur: number | null,
  decimales: number,
  decimalesMin = 0,
): string {
  return valeur === null
    ? VALEUR_ABSENTE
    : ecritEnFrancais(valeur, {
        minimumFractionDigits: decimalesMin,
        maximumFractionDigits: decimales,
      });
}

export function pourcentageAffiche(part: number): string {
  return ecritEnFrancais(part, {
    style: 'percent',
    maximumFractionDigits: 0,
  });
}

export function nombreFrancais(valeur: number, decimales: number): string {
  return sansEspacesTypographiques(nombreAffiche(valeur, decimales, decimales));
}

export function nombreSommable(valeur: number): string {
  return ecritEnFrancais(valeur, {
    useGrouping: false,
    maximumFractionDigits: TOUTES_LES_DECIMALES,
  });
}

export function avecVirgule(valeur: number, decimales?: number): string {
  const ecrite =
    decimales === undefined ? String(valeur) : valeur.toFixed(decimales);
  return ecrite.replace('.', ',');
}
