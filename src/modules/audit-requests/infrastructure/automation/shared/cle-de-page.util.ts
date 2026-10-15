import { sansFin } from '../../../../../common/domain/texte/sans-bords';

export function cleDePage(url: string, base?: string): string | null {
  try {
    const adresse = new URL(url, base);
    const chemin = sansFin(adresse.pathname, '/') || '/';
    return `${adresse.origin}${chemin}${adresse.search}`;
  } catch {
    return null;
  }
}
