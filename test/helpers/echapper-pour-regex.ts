const CARACTERES_SPECIAUX = /[.*+?^${}()|[\]\\]/g;

export function echapperPourRegex(texte: string): string {
  return texte.replaceAll(CARACTERES_SPECIAUX, '\\$&');
}
