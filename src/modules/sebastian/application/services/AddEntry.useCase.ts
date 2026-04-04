import { Inject, Injectable } from '@nestjs/common';
import { SebastianEntry } from '../../domain/SebastianEntry';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { AddEntryCommand } from '../dto/AddEntry.command';

/** Cree une entree de consommation via le domaine et la persiste. */
@Injectable()
export class AddEntryUseCase {
  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
  ) {}

  /** Execute l'ajout d'une entree de consommation. */
  async execute(command: AddEntryCommand): Promise<SebastianEntry> {
    const entry = SebastianEntry.create({
      userId: command.userId,
      category: command.category,
      quantity: command.quantity,
      date: command.date,
      notes: command.notes,
    });
    return this.entryRepo.create(entry);
  }
}
