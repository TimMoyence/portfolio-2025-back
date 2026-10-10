export function lienAvecJeton(base: string, jeton: string): string {
  if (!URL.canParse(base)) {
    const separateur = base.includes('?') ? '&' : '?';
    return `${base}${separateur}token=${encodeURIComponent(jeton)}`;
  }
  const url = new URL(base);
  url.searchParams.set('token', jeton);
  return url.toString();
}
