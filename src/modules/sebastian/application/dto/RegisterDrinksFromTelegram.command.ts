import type { ParsedDrink } from '../../domain/drink-parser';

export interface RegisterDrinksFromTelegramCommand {
  telegramUserId: number;
  drinks: ParsedDrink[];
}
