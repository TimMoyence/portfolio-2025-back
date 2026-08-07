import { Inject, Injectable } from '@nestjs/common';
import type { ITelegramLinkRepository } from '../../domain/ITelegramLink.repository';
import { TELEGRAM_LINK_REPOSITORY } from '../../domain/token';

export interface ResolveTelegramResult {
  userId: string;
}

@Injectable()
export class ResolveTelegramUserUseCase {
  constructor(
    @Inject(TELEGRAM_LINK_REPOSITORY)
    private readonly telegramLinkRepo: ITelegramLinkRepository,
  ) {}

  async execute(telegramUserId: number): Promise<ResolveTelegramResult | null> {
    const link =
      await this.telegramLinkRepo.findByTelegramUserId(telegramUserId);
    if (!link) return null;
    return { userId: link.userId };
  }
}
