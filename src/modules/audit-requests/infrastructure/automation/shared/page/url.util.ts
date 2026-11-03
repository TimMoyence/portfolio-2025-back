const PROTOCOLES_WEB = new Set(['http:', 'https:']);

export function origineSure(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function urlCandidateMemeOrigine(
  brut: string,
  base: string,
): string | null {
  const origine = origineSure(base);
  if (!origine) return null;
  try {
    const url = new URL(brut, base);
    if (!PROTOCOLES_WEB.has(url.protocol) || url.origin !== origine) {
      return null;
    }
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}
