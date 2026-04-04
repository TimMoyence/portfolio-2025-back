import type { SebastianEntry } from './SebastianEntry';

/** Filtres pour la recherche d'entrees de consommation. */
export interface SebastianEntryFilters {
  userId: string;
  from?: string;
  to?: string;
  category?: string;
}

/** Port de persistance pour les entrees de consommation Sebastian. */
export interface ISebastianEntryRepository {
  create(entry: SebastianEntry): Promise<SebastianEntry>;
  findByFilters(filters: SebastianEntryFilters): Promise<SebastianEntry[]>;
  findById(id: string): Promise<SebastianEntry | null>;
  delete(id: string): Promise<void>;
}
