export function estObjet(
  valeur: unknown,
): valeur is Readonly<Record<string, unknown>> {
  return (
    typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
  );
}

export function cueillirDansArbre<T>(
  valeur: unknown,
  retenir: (cle: string, element: unknown) => readonly T[] | null,
): T[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) =>
      cueillirDansArbre(element, retenir),
    );
  }
  if (!estObjet(valeur)) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, element]) => [
    ...(retenir(cle, element) ?? cueillirDansArbre(element, retenir)),
  ]);
}
