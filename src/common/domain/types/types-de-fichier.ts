export const TYPES_DE_FICHIER = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv; charset=utf-8',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
} as const;

export type TypeDeFichier = keyof typeof TYPES_DE_FICHIER;

const LONGUEUR_DE_L_EMPREINTE = 8;

export const NOM_SERVI = String.raw`([A-Za-z0-9_-]+)\.[0-9a-f]{${LONGUEUR_DE_L_EMPREINTE}}\.(${Object.keys(TYPES_DE_FICHIER).join('|')})`;

export const nomServi = (
  base: string,
  empreinte: string,
  extension: TypeDeFichier,
): string =>
  `${base}.${empreinte.slice(0, LONGUEUR_DE_L_EMPREINTE)}.${extension}`;
