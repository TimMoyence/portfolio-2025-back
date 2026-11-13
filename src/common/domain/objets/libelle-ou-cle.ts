export function libelleOuCle(
  libelles: Readonly<Record<string, string>>,
  cle: string,
): string {
  return Object.hasOwn(libelles, cle) ? libelles[cle] : cle;
}
