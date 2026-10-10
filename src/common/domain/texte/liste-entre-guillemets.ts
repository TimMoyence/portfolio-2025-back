function entreGuillemets(valeur: string): string {
  return `« ${valeur} »`;
}

export function listeEntreGuillemets(valeurs: readonly string[]): string {
  return valeurs.map(entreGuillemets).join(', ');
}
