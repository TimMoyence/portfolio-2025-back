import type { ParsedDrink } from '../../domain/drink-parser';

/** Commande pour enregistrer des consommations depuis Telegram. */
export interface RegisterDrinksFromTelegramCommand {
  telegramUserId: number;
  drinks: ParsedDrink[];
}
