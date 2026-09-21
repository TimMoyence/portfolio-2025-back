import type { Cours } from '../contrats/cours';

export interface CoursPublie {
  readonly cours: Cours;
  readonly version: number;
  readonly publieLe: Date;
}

export interface ICatalogueCours {
  trouver(slug: string, version?: number): Promise<Cours | null>;
  trouverCourant(slug: string): Promise<CoursPublie | null>;
}
