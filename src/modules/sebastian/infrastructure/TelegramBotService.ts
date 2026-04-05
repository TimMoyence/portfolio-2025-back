import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { SebastianBotHandler } from '../interfaces/telegram/SebastianBot.handler';

/**
 * Service de cycle de vie du bot Telegram Sebastian.
 *
 * Demarre le bot en long polling si le token est configure,
 * sinon ignore silencieusement (ne casse jamais l'API REST).
 */
@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly handler: SebastianBotHandler,
  ) {}

  onModuleInit(): void {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN non configure — bot Telegram desactive',
      );
      return;
    }

    this.bot = new Bot(token);
    this.handler.register(this.bot);

    void this.bot.start({
      onStart: () => this.logger.log('Bot Telegram Sebastian demarre'),
    });
  }

  onModuleDestroy(): void {
    if (this.bot) {
      void this.bot.stop();
      this.logger.log('Bot Telegram Sebastian arrete');
    }
  }
}
