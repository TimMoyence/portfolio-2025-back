import { Inject, Injectable } from '@nestjs/common';
import type { ITelegramLinkRepository } from '../../domain/ITelegramLink.repository';
import type { IUsersRepository } from '../../../users/domain/IUsers.repository';
import { TELEGRAM_LINK_REPOSITORY } from '../../domain/token';
import { USERS_REPOSITORY } from '../../../users/domain/token';
import { TelegramLink } from '../../domain/TelegramLink';
import type { LinkTelegramCommand } from '../dto/LinkTelegram.command';

/** Resultat du lien Telegram-utilisateur. */
export interface LinkTelegramResult {
  link: TelegramLink;
  firstName: string;
}

/** Lie un compte Telegram a un utilisateur du portfolio via son email. */
@Injectable()
export class LinkTelegramUserUseCase {
  constructor(
    @Inject(TELEGRAM_LINK_REPOSITORY)
    private readonly telegramLinkRepo: ITelegramLinkRepository,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
  ) {}

  /** Execute le lien entre un compte Telegram et un utilisateur existant. */
  async execute(command: LinkTelegramCommand): Promise<LinkTelegramResult> {
    const user = await this.usersRepo.findByEmail(
      command.email.trim().toLowerCase(),
    );

    if (!user || !user.id) {
      throw new Error(`Aucun utilisateur trouve avec l'email ${command.email}`);
    }

    if (!user.roles.includes('sebastian')) {
      throw new Error(
        `L'utilisateur ${command.email} n'a pas acces a Sebastian`,
      );
    }

    const existing = await this.telegramLinkRepo.findByTelegramUserId(
      command.telegramUserId,
    );
    if (existing) {
      return { link: existing, firstName: user.firstName };
    }

    const link = TelegramLink.create({
      telegramUserId: command.telegramUserId,
      userId: user.id,
    });

    const saved = await this.telegramLinkRepo.create(link);
    return { link: saved, firstName: user.firstName };
  }
}
