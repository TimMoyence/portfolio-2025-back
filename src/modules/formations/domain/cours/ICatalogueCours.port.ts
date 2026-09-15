import type { Cours } from './Cours';

export interface ICatalogueCours {
  trouver(slug: string): Cours | null;
}
