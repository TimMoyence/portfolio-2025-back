import { Injectable, Logger } from '@nestjs/common';
import type { Bot, Context } from 'grammy';
import { parseDrinkMessage } from '../../domain/drink-parser';
import type { ParsedDrink } from '../../domain/drink-parser';
import { LinkTelegramUserUseCase } from '../../application/services/LinkTelegramUser.useCase';
import { ResolveTelegramUserUseCase } from '../../application/services/ResolveTelegramUser.useCase';
import { RegisterDrinksFromTelegramUseCase } from '../../application/services/RegisterDrinksFromTelegram.useCase';
import { CalculateBacUseCase } from '../../application/services/CalculateBac.useCase';
import {
  buildDrinkTypeKeyboard,
  buildQuantityKeyboard,
  parseCallbackData,
} from './DrinkKeyboard';

const AWAITING_EMAIL_TTL_MS = 5 * 60 * 1000;

interface PendingState {
  state: 'awaiting_email';
  expiresAt: number;
}

/** Gere les commandes et messages du bot Telegram Sebastian. */
@Injectable()
export class SebastianBotHandler {
  private readonly logger = new Logger(SebastianBotHandler.name);
  private readonly pendingLinks = new Map<number, PendingState>();

  constructor(
    private readonly linkTelegramUser: LinkTelegramUserUseCase,
    private readonly resolveTelegramUser: ResolveTelegramUserUseCase,
    private readonly registerDrinks: RegisterDrinksFromTelegramUseCase,
    private readonly calculateBac: CalculateBacUseCase,
  ) {}

  /** Enregistre tous les handlers sur le bot grammy. */
  register(bot: Bot): void {
    bot.command('start', (ctx) => this.handleStart(ctx));
    bot.command('pint', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('beer', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('coffee', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('biere', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('cafe', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('pinte', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('vin', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('champagne', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('cocktail', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('spiritueux', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('cidre', (ctx) => this.handleDrinkCommand(ctx));
    bot.command('menu', (ctx) => this.handleMenu(ctx));
    bot.command('help', (ctx) => this.handleMenu(ctx));
    bot.command('taux', (ctx) => this.handleBac(ctx));
    bot.on('callback_query:data', (ctx) => this.handleCallbackQuery(ctx));
    bot.on('message:text', (ctx) => this.handleTextMessage(ctx));

    bot.api
      .setMyCommands([
        { command: 'start', description: 'Lier votre compte' },
        { command: 'beer', description: 'Enregistrer une biere' },
        { command: 'biere', description: 'Enregistrer une biere (FR)' },
        { command: 'pint', description: 'Enregistrer une pinte' },
        { command: 'vin', description: 'Enregistrer un verre de vin' },
        { command: 'champagne', description: 'Enregistrer du champagne' },
        { command: 'cocktail', description: 'Enregistrer un cocktail' },
        { command: 'spiritueux', description: 'Enregistrer un spiritueux' },
        { command: 'cidre', description: 'Enregistrer un cidre' },
        { command: 'coffee', description: 'Enregistrer un cafe' },
        { command: 'cafe', description: 'Enregistrer un cafe (FR)' },
        { command: 'taux', description: "Voir votre taux d'alcoolemie" },
        { command: 'menu', description: 'Voir les commandes disponibles' },
      ])
      .catch(() => {
        /* ignore si pas admin */
      });
  }

  private async handleStart(ctx: Context): Promise<void> {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    // Verifie si deja lie
    const existing = await this.resolveTelegramUser.execute(telegramUserId);
    if (existing) {
      await ctx.reply(
        'Tu es deja lie ! Envoie /pint, /beer ou /coffee pour enregistrer.',
      );
      return;
    }

    this.pendingLinks.set(telegramUserId, {
      state: 'awaiting_email',
      expiresAt: Date.now() + AWAITING_EMAIL_TTL_MS,
    });

    await ctx.reply(
      'Bienvenue sur Sebastian ! Avec quel email es-tu inscrit sur le portfolio ?',
    );
  }

  private async handleDrinkCommand(ctx: Context): Promise<void> {
    const telegramUserId = ctx.from?.id;
    const text = ctx.message?.text;
    if (!telegramUserId || !text) return;

    const resolved = await this.resolveTelegramUser.execute(telegramUserId);
    if (!resolved) {
      await ctx.reply('Compte non lie. Utilise /start pour te connecter.');
      return;
    }

    const result = parseDrinkMessage(text);
    if (result.drinks.length === 0) {
      await ctx.reply('Commande non reconnue. Essaie /pint, /beer ou /coffee.');
      return;
    }

    try {
      await this.registerDrinks.execute({
        telegramUserId,
        drinks: result.drinks,
      });
      await ctx.reply(this.formatConfirmation(result.drinks));
    } catch (error: unknown) {
      this.logger.error('Erreur enregistrement boisson', error);
      await ctx.reply("Erreur lors de l'enregistrement. Reessaie.");
    }
  }

  private async handleTextMessage(ctx: Context): Promise<void> {
    const telegramUserId = ctx.from?.id;
    const text = ctx.message?.text;
    if (!telegramUserId || !text) return;

    // Verifie s'il y a un lien email en attente
    const pending = this.pendingLinks.get(telegramUserId);
    if (pending && pending.expiresAt > Date.now()) {
      this.pendingLinks.delete(telegramUserId);
      await this.handleEmailLink(ctx, telegramUserId, text);
      return;
    }
    this.pendingLinks.delete(telegramUserId);

    // Verifie si le compte est lie
    const resolved = await this.resolveTelegramUser.execute(telegramUserId);
    if (!resolved) {
      await ctx.reply('Compte non lie. Utilise /start pour te connecter.');
      return;
    }

    // Tente le parsing NLP
    const result = parseDrinkMessage(text);

    if (result.drinks.length > 0 && result.confident) {
      try {
        await this.registerDrinks.execute({
          telegramUserId,
          drinks: result.drinks,
        });
        await ctx.reply(this.formatConfirmation(result.drinks));
      } catch (error: unknown) {
        this.logger.error('Erreur enregistrement boisson', error);
        await ctx.reply("Erreur lors de l'enregistrement. Reessaie.");
      }
      return;
    }

    // Non confiant ou aucune boisson → affiche le clavier
    await ctx.reply("Je n'ai pas compris. Choisis ta boisson :", {
      reply_markup: buildDrinkTypeKeyboard(),
    });
  }

  private async handleEmailLink(
    ctx: Context,
    telegramUserId: number,
    email: string,
  ): Promise<void> {
    try {
      const result = await this.linkTelegramUser.execute({
        telegramUserId,
        email,
      });
      await ctx.reply(
        `Compte lie avec succes ! Bienvenue ${result.firstName}. ` +
          'Envoie /pint, /beer ou /coffee pour enregistrer une consommation.',
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      await ctx.reply(`Impossible de lier le compte : ${message}`);
    }
  }

  private async handleCallbackQuery(ctx: Context): Promise<void> {
    const telegramUserId = ctx.from?.id;
    const data = ctx.callbackQuery?.data;
    if (!telegramUserId || !data) return;

    const parsed = parseCallbackData(data);
    if (!parsed) {
      await ctx.answerCallbackQuery({ text: 'Action non reconnue' });
      return;
    }

    if (parsed.action === 'select_type' && parsed.drinkType) {
      await ctx.editMessageText(
        `Combien de ${this.drinkLabel(parsed.drinkType)} ?`,
        { reply_markup: buildQuantityKeyboard(parsed.drinkType) },
      );
      await ctx.answerCallbackQuery();
      return;
    }

    if (parsed.action === 'confirm' && parsed.drinkType && parsed.quantity) {
      const drink = this.drinkFromType(parsed.drinkType, parsed.quantity);

      try {
        await this.registerDrinks.execute({
          telegramUserId,
          drinks: [drink],
        });
        await ctx.editMessageText(this.formatConfirmation([drink]));
        await ctx.answerCallbackQuery({ text: 'Enregistre !' });
      } catch (error: unknown) {
        this.logger.error('Erreur callback enregistrement', error);
        await ctx.answerCallbackQuery({ text: 'Erreur, reessaie.' });
      }
    }
  }

  private async handleMenu(ctx: Context): Promise<void> {
    const lines = [
      'Commandes disponibles :',
      '',
      '/beer [qty] [deg] - Biere',
      '/pint [qty] - Pinte',
      '/vin [qty] [deg] - Vin',
      '/champagne [qty] - Champagne',
      '/cocktail [qty] - Cocktail',
      '/spiritueux [qty] - Spiritueux',
      '/cidre [qty] - Cidre',
      '/coffee [qty] - Cafe',
      '',
      "/taux - Taux d'alcoolemie actuel",
      '/start - Lier votre compte',
      '/menu - Cette aide',
    ];
    await ctx.reply(lines.join('\n'));
  }

  private async handleBac(ctx: Context): Promise<void> {
    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) return;

    const resolved = await this.resolveTelegramUser.execute(telegramUserId);
    if (!resolved) {
      await ctx.reply('Compte non lie. Utilise /start pour te connecter.');
      return;
    }

    try {
      const result = await this.calculateBac.execute({
        userId: resolved.userId,
      });
      const bacText = result.currentBac.toFixed(2);
      const status =
        result.currentBac >= 0.5
          ? 'ATTENTION'
          : result.currentBac >= 0.25
            ? 'Modere'
            : 'OK';
      let msg = `[${status}] Taux actuel : ${bacText} g/L`;
      if (result.estimatedSoberAt) {
        const h = result.estimatedSoberAt
          .getHours()
          .toString()
          .padStart(2, '0');
        const m = result.estimatedSoberAt
          .getMinutes()
          .toString()
          .padStart(2, '0');
        msg += `\nSobriete estimee : ${h}:${m}`;
      }
      if (result.currentBac >= 0.5) {
        msg += '\nAu-dessus de la limite legale (0.5 g/L)';
      }
      await ctx.reply(msg);
    } catch (error: unknown) {
      this.logger.error('Erreur calcul BAC', error);
      await ctx.reply('Erreur lors du calcul. Reessaie.');
    }
  }

  private drinkFromType(type: string, count: number): ParsedDrink {
    switch (type) {
      case 'pint':
        return {
          category: 'alcohol',
          quantity: count * 2,
          unit: 'standard_drink',
          source: 'pint',
          displayCount: count,
          drinkType: 'beer',
          alcoholDegree: 5,
          volumeCl: 50,
        };
      case 'beer':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'beer',
          displayCount: count,
          drinkType: 'beer',
          alcoholDegree: 5,
          volumeCl: 25,
        };
      case 'wine':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'wine',
          displayCount: count,
          drinkType: 'wine',
          alcoholDegree: 12,
          volumeCl: 12.5,
        };
      case 'champagne':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'champagne',
          displayCount: count,
          drinkType: 'champagne',
          alcoholDegree: 12,
          volumeCl: 12.5,
        };
      case 'cocktail':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'cocktail',
          displayCount: count,
          drinkType: 'cocktail',
          alcoholDegree: 15,
          volumeCl: 20,
        };
      case 'spiritueux':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'spiritueux',
          displayCount: count,
          drinkType: 'spiritueux',
          alcoholDegree: 40,
          volumeCl: 4,
        };
      case 'cidre':
        return {
          category: 'alcohol',
          quantity: count,
          unit: 'standard_drink',
          source: 'cidre',
          displayCount: count,
          drinkType: 'cidre',
          alcoholDegree: 5,
          volumeCl: 25,
        };
      case 'coffee':
      default:
        return {
          category: 'coffee',
          quantity: count,
          unit: 'cup',
          source: 'coffee',
          displayCount: count,
          drinkType: 'coffee',
        };
    }
  }

  private drinkLabel(type: string): string {
    switch (type) {
      case 'pint':
        return 'pintes';
      case 'beer':
        return 'bieres';
      case 'wine':
        return 'verres de vin';
      case 'champagne':
        return 'coupes de champagne';
      case 'cocktail':
        return 'cocktails';
      case 'spiritueux':
        return 'spiritueux';
      case 'cidre':
        return 'cidres';
      case 'coffee':
        return 'cafes';
      default:
        return type;
    }
  }

  /** Formate un message de confirmation pour les boissons enregistrees. */
  formatConfirmation(drinks: ParsedDrink[]): string {
    const lines = drinks.map((d) => {
      const label = this.drinkLabel(d.source);
      const degree =
        d.alcoholDegree && d.alcoholDegree > 0 ? ` ${d.alcoholDegree}°` : '';
      const detail =
        d.source === 'pint' ? ` (${d.quantity} verres standard)` : '';
      return `${d.displayCount} ${label}${degree}${detail}`;
    });
    return `Enregistre : ${lines.join(', ')}`;
  }
}
