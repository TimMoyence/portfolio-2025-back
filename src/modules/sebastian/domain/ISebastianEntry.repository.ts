import type { SebastianEntry } from './SebastianEntry';

export interface SebastianEntryFilters {
  userId: string;
  from?: string;
  to?: string;
  category?: string;
}

export interface ISebastianEntryRepository {
  create(entry: SebastianEntry): Promise<SebastianEntry>;
  findByFilters(filters: SebastianEntryFilters): Promise<SebastianEntry[]>;
  findById(id: string): Promise<SebastianEntry | null>;
  delete(id: string): Promise<void>;
}
