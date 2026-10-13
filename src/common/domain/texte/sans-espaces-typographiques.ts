export const ESPACE_INSECABLE = String.fromCodePoint(0xa0);
export const ESPACE_FINE_INSECABLE = String.fromCodePoint(0x20_2f);
const SIGNE_MOINS = String.fromCodePoint(0x22_12);
const ESPACES_TYPOGRAPHIQUES = new RegExp(
  `[${ESPACE_INSECABLE}${ESPACE_FINE_INSECABLE}]`,
  'gu',
);

export function sansEspacesTypographiques(texte: string): string {
  return texte.replaceAll(ESPACES_TYPOGRAPHIQUES, ' ');
}

export function sansEspacesNiMoinsTypographiques(texte: string): string {
  return sansEspacesTypographiques(texte).replaceAll(SIGNE_MOINS, '-');
}
