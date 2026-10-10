export function estObjet(
  valeur: unknown,
): valeur is Readonly<Record<string, unknown>> {
  return (
    typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
  );
}

type Retenir<T> = (cle: string, element: unknown) => readonly T[] | null;

export function cueillirDansArbre<T>(
  valeur: unknown,
  retenir: Retenir<T>,
): T[] {
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) =>
      cueillirDansArbre(element, retenir),
    );
  }
  if (!estObjet(valeur)) {
    return [];
  }
  return Object.entries(valeur).flatMap(([cle, element]) =>
    cueillirSous(cle, element, retenir),
  );
}

export function cueillirSous<T>(
  cle: string,
  valeur: unknown,
  retenir: Retenir<T>,
): T[] {
  const retenus = retenir(cle, valeur);
  if (retenus !== null) {
    return [...retenus];
  }
  if (Array.isArray(valeur)) {
    return valeur.flatMap((element: unknown) =>
      cueillirSous(cle, element, retenir),
    );
  }
  return cueillirDansArbre(valeur, retenir);
}
