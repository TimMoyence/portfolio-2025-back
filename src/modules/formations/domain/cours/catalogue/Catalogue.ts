import type { Cours } from '../Cours';
import type { ICatalogueCours } from '../ICatalogueCours.port';

export function creerCatalogue(cours: readonly Cours[]): ICatalogueCours {
  const parSlug = new Map<string, Cours>();
  for (const unCours of cours) {
    if (parSlug.has(unCours.slug)) {
      throw new Error(
        `Slug de cours en double dans le catalogue : « ${unCours.slug} ».`,
      );
    }
    parSlug.set(unCours.slug, unCours);
  }
  return {
    trouver(slug, version) {
      return version === undefined || version === 1
        ? (parSlug.get(slug) ?? null)
        : null;
    },
    trouverCourant(slug) {
      const cours = parSlug.get(slug);
      return cours === undefined ? null : { cours, version: 1 };
    },
  };
}
