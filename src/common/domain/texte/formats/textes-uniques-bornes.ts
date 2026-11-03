export function textesUniquesBornes(
  textes: readonly string[],
  max: number,
): string[] {
  const nettoyes = textes.map((texte) => texte.trim()).filter(Boolean);
  return [...new Set(nettoyes)].slice(0, max);
}
