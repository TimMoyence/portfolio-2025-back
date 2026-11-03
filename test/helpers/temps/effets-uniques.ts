export function attendreResultatEtEffetsUniques(
  resultat: unknown,
  attendu: unknown,
  ...effets: unknown[]
): void {
  expect(resultat).toEqual(attendu);
  for (const effet of effets) expect(effet).toHaveBeenCalledTimes(1);
}
