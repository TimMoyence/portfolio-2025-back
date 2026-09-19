import type { Cours } from '../contrats/cours';

export interface ICatalogueCours {
  trouver(slug: string, version?: number): Promise<Cours | null>;
  trouverCourant(
    slug: string,
  ): Promise<{ cours: Cours; version: number } | null>;
}
