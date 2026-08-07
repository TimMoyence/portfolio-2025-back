import { PresentationInteractions } from './SlideInteraction';

export interface IPresentationsRepository {
  findBySlug(slug: string): Promise<PresentationInteractions | null>;
}
