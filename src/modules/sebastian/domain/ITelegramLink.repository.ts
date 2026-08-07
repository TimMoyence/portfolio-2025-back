import type { TelegramLink } from './TelegramLink';

export interface ITelegramLinkRepository {
  create(link: TelegramLink): Promise<TelegramLink>;
  findByTelegramUserId(telegramUserId: number): Promise<TelegramLink | null>;
  findByUserId(userId: string): Promise<TelegramLink | null>;
  delete(id: string): Promise<void>;
}
