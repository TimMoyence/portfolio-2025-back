export function sansLesCles<T extends object>(
  objet: T,
  cles: readonly string[],
): string extends keyof T ? T : Partial<T> {
  return Object.fromEntries(
    Object.entries(objet).filter(([cle]) => !cles.includes(cle)),
  ) as string extends keyof T ? T : Partial<T>;
}
