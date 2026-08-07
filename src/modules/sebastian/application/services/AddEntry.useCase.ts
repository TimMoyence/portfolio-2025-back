import { Inject, Injectable, Logger } from '@nestjs/common';
import { SebastianEntry } from '../../domain/SebastianEntry';
import type { ISebastianEntryRepository } from '../../domain/ISebastianEntry.repository';
import type { IBadgesEvaluationQueuePort } from '../../domain/IBadgesEvaluationQueue.port';
import {
  BADGES_EVALUATION_QUEUE,
  SEBASTIAN_ENTRY_REPOSITORY,
} from '../../domain/token';
import type { AddEntryCommand } from '../dto/AddEntry.command';

@Injectable()
export class AddEntryUseCase {
  private readonly logger = new Logger(AddEntryUseCase.name);

  constructor(
    @Inject(SEBASTIAN_ENTRY_REPOSITORY)
    private readonly entryRepo: ISebastianEntryRepository,
    @Inject(BADGES_EVALUATION_QUEUE)
    private readonly badgesQueue: IBadgesEvaluationQueuePort,
  ) {}

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

    this.badgesQueue.enqueue(command.userId).catch((err: unknown) => {
      const detail = this.formatBadgeError(err);
      this.logger.warn(
        `Echec enqueue evaluation badges pour ${command.userId} — ${detail}`,
      );
    });

    return saved;
  }

  private formatBadgeError(err: unknown): string {
    if (err instanceof Error) {
      const stack = err.stack
        ? ` | stack=${err.stack.replace(/\s+/g, ' ').slice(0, 500)}`
        : '';
      return `${err.name}: ${err.message}${stack}`;
    }
    return String(err);
  }
}
