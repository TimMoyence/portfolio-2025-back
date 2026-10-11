import { sansBords } from './sans-bords';
import { sansDiacritiques } from './sans-diacritiques';

const HORS_ALPHANUMERIQUE = /[^a-z0-9]+/g;

export function enSlug(texte: string, longueurMax: number): string {
  const slug = sansDiacritiques(texte)
    .toLowerCase()
    .replace(HORS_ALPHANUMERIQUE, '-');
  return sansBords(sansBords(slug, '-').slice(0, longueurMax), '-');
}
