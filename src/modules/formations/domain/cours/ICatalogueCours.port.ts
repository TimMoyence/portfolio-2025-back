import type { Cours } from './Cours';

export interface ICatalogueCours {
  trouver(slug: string, version?: number): Cours | null | Promise<Cours | null>;
  trouverCourant(
    slug: string,
  ):
    | { cours: Cours; version: number }
    | null
    | Promise<{ cours: Cours; version: number } | null>;
}
