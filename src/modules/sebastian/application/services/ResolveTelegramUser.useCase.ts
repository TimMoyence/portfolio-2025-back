import { Inject, Injectable } from '@nestjs/common';
import type { ITelegramLinkRepository } from '../../domain/ITelegramLink.repository';
import { TELEGRAM_LINK_REPOSITORY } from '../../domain/token';

/** Resultat de la resolution d'un utilisateur Telegram. */
export interface ResolveTelegramResult {
  userId: string;
}

/** Resout l'identifiant Telegram vers l'identifiant utilisateur en base. */
@Injectable()
export class ResolveTelegramUserUseCase {
  constructor(
    @Inject(TELEGRAM_LINK_REPOSITORY)
    private readonly telegramLinkRepo: ITelegramLinkRepository,
  ) {}

  /** Resout un identifiant Telegram en identifiant utilisateur. */
  async execute(telegramUserId: number): Promise<ResolveTelegramResult | null> {
    const link =
      await this.telegramLinkRepo.findByTelegramUserId(telegramUserId);
    if (!link) return null;
    return { userId: link.userId };
  }
}
