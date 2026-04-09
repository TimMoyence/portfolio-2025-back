import { Inject, Injectable, Logger } from '@nestjs/common';
import { SebastianEntry } from '../../domain/SebastianEntry';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import { SEBASTIAN_ENTRY_REPOSITORY } from '../../domain/token';
import type { AddEntryCommand } from '../dto/AddEntry.command';
import { EvaluateBadgesUseCase } from './EvaluateBadges.useCase';

/** Cree une entree de consommation via le domaine et la persiste. */
@Injectable()
export class AddEntryUseCase {
  private readonly logger = new Logger(AddEntryUseCase.name);

  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {}

  /** Execute l'ajout d'une entree de consommation et evalue les badges. */
  async execute(command: AddEntryCommand): Promise<SebastianEntry> {
    const entry = SebastianEntry.create({
      userId: command.userId,
      category: command.category,
      quantity: command.quantity,
      date: command.date,
      notes: command.notes,
      drinkType: command.drinkType,
      alcoholDegree: command.alcoholDegree,
      volumeCl: command.volumeCl,
      consumedAt: command.consumedAt,
    });
    const saved = await this.entryRepo.create(entry);

    // Evaluation des badges en post-traitement (fire-and-forget, pas bloquant)
    this.evaluateBadges.execute(command.userId).catch((err: unknown) => {
      this.logger.warn(`Echec evaluation badges pour ${command.userId}`, err);
    });

    return saved;
  }
}
