export async function traiterEnParallele<E, R>(
  elements: readonly E[],
  concurrence: number,
  traiter: (element: E) => Promise<R>,
  apresChaque?: (
    resultat: R,
    faits: number,
    total: number,
    element: E,
  ) => Promise<void>,
): Promise<R[]> {
  const total = elements.length;
  const resultats = Array<R>(total);
  let curseur = 0;
  let faits = 0;

  const ouvrier = async (): Promise<void> => {
    while (curseur < total) {
      const index = curseur;
      curseur += 1;
      const element = elements[index];
      const resultat = await traiter(element);
      resultats[index] = resultat;
      faits += 1;
      await apresChaque?.(resultat, faits, total, element);
    }
  };

  const ouvriers = Math.min(Math.max(1, concurrence), Math.max(1, total));
  await Promise.all(Array.from({ length: ouvriers }, () => ouvrier()));
  return resultats;
}
