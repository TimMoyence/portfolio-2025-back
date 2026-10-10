function finSans(texte: string, caractere: string, debut: number): number {
  let fin = texte.length;
  while (fin > debut && texte[fin - 1] === caractere) fin -= 1;
  return fin;
}

export function sansFin(texte: string, caractere: string): string {
  return texte.slice(0, finSans(texte, caractere, 0));
}

export function sansBords(texte: string, caractere: string): string {
  let debut = 0;
  while (debut < texte.length && texte[debut] === caractere) debut += 1;
  return texte.slice(debut, finSans(texte, caractere, debut));
}
