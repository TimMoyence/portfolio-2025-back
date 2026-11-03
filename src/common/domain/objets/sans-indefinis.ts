export function sansIndefinis<T extends object>(objet: T): T {
  return Object.fromEntries(
    Object.entries(objet).filter(([, valeur]) => valeur !== undefined),
  ) as T;
}
