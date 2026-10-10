export function compacterBlancs(texte: string): string {
  return texte.replace(/\s+/g, ' ').trim();
}
