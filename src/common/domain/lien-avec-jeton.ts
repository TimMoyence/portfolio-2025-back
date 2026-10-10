function requeteEncodee(parametres: Readonly<Record<string, string>>): string {
  return Object.entries(parametres)
    .map(
      ([nom, valeur]) =>
        `${encodeURIComponent(nom)}=${encodeURIComponent(valeur)}`,
    )
    .join('&');
}

export function lienAvecParametres(
  base: string,
  parametres: Readonly<Record<string, string>>,
): string {
  if (!URL.canParse(base)) {
    const separateur = base.includes('?') ? '&' : '?';
    return `${base}${separateur}${requeteEncodee(parametres)}`;
  }
  const url = new URL(base);
  for (const [nom, valeur] of Object.entries(parametres)) {
    url.searchParams.set(nom, valeur);
  }
  return url.toString();
}

export function lienAvecJeton(base: string, jeton: string): string {
  return lienAvecParametres(base, { token: jeton });
}
