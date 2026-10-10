const MARQUES_COMBINANTES = /\p{M}/gu;

export function sansDiacritiques(texte: string): string {
  return texte.normalize('NFD').replace(MARQUES_COMBINANTES, '');
}
