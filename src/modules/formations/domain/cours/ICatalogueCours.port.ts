import type { Cours } from './Cours';

export interface ICatalogueCours {
  trouver(slug: string, version?: number): Promise<Cours | null>;
  trouverCourant(
    slug: string,
  ): Promise<{ cours: Cours; version: number } | null>;
}
