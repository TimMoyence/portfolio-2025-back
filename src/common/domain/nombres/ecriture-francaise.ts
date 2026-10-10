const ESPACE_FINE_INSECABLE = String.fromCodePoint(0x20_2f);

export function nombreFrancais(valeur: number, decimales: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
    .format(valeur)
    .replaceAll(ESPACE_FINE_INSECABLE, ' ');
}

export function avecVirgule(valeur: number, decimales?: number): string {
  const ecrite =
    decimales === undefined ? String(valeur) : valeur.toFixed(decimales);
  return ecrite.replace('.', ',');
}
