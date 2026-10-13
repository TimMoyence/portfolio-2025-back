import { sansEspacesTypographiques } from '../texte/sans-espaces-typographiques';

export function nombreFrancais(valeur: number, decimales: number): string {
  return sansEspacesTypographiques(
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valeur),
  );
}

export function avecVirgule(valeur: number, decimales?: number): string {
  const ecrite =
    decimales === undefined ? String(valeur) : valeur.toFixed(decimales);
  return ecrite.replace('.', ',');
}
