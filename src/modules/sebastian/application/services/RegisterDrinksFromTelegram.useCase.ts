import { Injectable } from '@nestjs/common';
import type { SebastianEntry } from '../../domain/SebastianEntry';
import type { RegisterDrinksFromTelegramCommand } from '../dto/RegisterDrinksFromTelegram.command';
import { ResolveTelegramUserUseCase } from './ResolveTelegramUser.useCase';
import { AddEntryUseCase } from './AddEntry.useCase';

/** Enregistre des consommations depuis un message Telegram. */
@Injectable()
export class RegisterDrinksFromTelegramUseCase {
  constructor(
    private readonly resolveTelegramUser: ResolveTelegramUserUseCase,
    private readonly addEntry: AddEntryUseCase,
  ) {}

  /** Execute l'enregistrement de boissons parsees depuis Telegram. */
  async execute(
    command: RegisterDrinksFromTelegramCommand,
  ): Promise<SebastianEntry[]> {
    const resolved = await this.resolveTelegramUser.execute(
      command.telegramUserId,
    );
    if (!resolved) {
      throw new Error(
        'Compte Telegram non lie. Utilisez /start pour lier votre compte.',
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const entries: SebastianEntry[] = [];

    for (const drink of command.drinks) {
      const entry = await this.addEntry.execute({
        userId: resolved.userId,
        category: drink.category,
        quantity: drink.quantity,
        date: today,
        notes: 'via Telegram',
        drinkType: drink.drinkType,
        alcoholDegree: drink.alcoholDegree,
        volumeCl: drink.volumeCl,
      });
      entries.push(entry);
    }

    return entries;
  }
}
