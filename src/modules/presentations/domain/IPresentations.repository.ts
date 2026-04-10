import { PresentationInteractions } from './SlideInteraction';

/** Port de persistance pour les interactions de présentation. */
export interface IPresentationsRepository {
  /** Retourne les interactions d'une présentation par son slug, ou null si absente. */
  findBySlug(slug: string): Promise<PresentationInteractions | null>;
}
