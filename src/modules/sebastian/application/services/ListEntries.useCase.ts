import { Inject, Injectable } from '@nestjs/common';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { ListEntriesQuery } from '../dto/ListEntries.query';

/** Recupere les entrees de consommation filtrees pour un utilisateur. */
@Injectable()
export class ListEntriesUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
  ) {}

  /** Execute la recuperation des entrees avec filtres. */
  async execute(query: ListEntriesQuery): Promise<SebastianEntry[]> {
    return this.entryRepo.findByFilters({
      userId: query.userId,
      from: query.from,
      to: query.to,
      category: query.category,
    });
  }
}
