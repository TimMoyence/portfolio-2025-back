import { SebastianBotHandler } from './SebastianBot.handler';
import type { LinkTelegramUserUseCase } from '../../application/services/LinkTelegramUser.useCase';
import type { ResolveTelegramUserUseCase } from '../../application/services/ResolveTelegramUser.useCase';
import type { RegisterDrinksFromTelegramUseCase } from '../../application/services/RegisterDrinksFromTelegram.useCase';
import type { CalculateBacUseCase } from '../../application/services/CalculateBac.useCase';
import {
  createMockSebastianBotUseCases,
  type MockSebastianBotUseCases,
} from '../../../../../test/factories/sebastian.factory';
import { TelegramLink } from '../../domain/TelegramLink';

type AnyFn = (...args: unknown[]) => unknown;

/** Cree un contexte grammy minimal pour les tests. */
function mockContext(overrides: Record<string, unknown> = {}): {
  from: { id: number };
  message: { text: string };
  reply: jest.Mock;
  editMessageText: jest.Mock;
  answerCallbackQuery: jest.Mock;
  callbackQuery: null;
  [key: string]: unknown;
} {
  return {
    from: { id: 123456 },
    message: { text: '' },
    reply: jest.fn(),
    editMessageText: jest.fn(),
    answerCallbackQuery: jest.fn(),
    callbackQuery: null,
    ...overrides,
  };
}

/** Cree un mock de bot grammy qui capture les handlers enregistres. */
function createMockBot(): {
  command: jest.Mock;
  on: jest.Mock;
  api: { setMyCommands: jest.Mock };
  handlers: Record<string, AnyFn>;
  messageHandlers: Array<[string, AnyFn]>;
} {
  const handlers: Record<string, AnyFn> = {};
  const messageHandlers: Array<[string, AnyFn]> = [];
  return {
    command: jest.fn((cmd: string, fn: AnyFn) => {
      handlers[cmd] = fn;
    }),
    on: jest.fn((event: string, fn: AnyFn) => {
      messageHandlers.push([event, fn]);
    }),
    api: { setMyCommands: jest.fn().mockResolvedValue(true) },
    handlers,
    messageHandlers,
  };
}

describe('SebastianBotHandler', () => {
  let handler: SebastianBotHandler;
  let useCases: MockSebastianBotUseCases;

  beforeEach(() => {
    useCases = createMockSebastianBotUseCases();
    handler = new SebastianBotHandler(
      useCases.linkUser as unknown as LinkTelegramUserUseCase,
      useCases.resolveUser as unknown as ResolveTelegramUserUseCase,
      useCases.registerDrinks as unknown as RegisterDrinksFromTelegramUseCase,
      useCases.calculateBac as unknown as CalculateBacUseCase,
    );
  });

  describe('handleStart', () => {
    it("demande l'email si non lie", async () => {
      useCases.resolveUser.execute.mockResolvedValue(null);
      const ctx = mockContext();
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      await bot.handlers['start'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('email'));
    });

    it('informe si deja lie', async () => {
      useCases.resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      const ctx = mockContext();
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      await bot.handlers['start'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('deja lie'),
      );
    });
  });

  describe('handleDrinkCommand', () => {
    it('enregistre /pint 4 et confirme', async () => {
      useCases.resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      useCases.registerDrinks.execute.mockResolvedValue([]);
      const ctx = mockContext({ message: { text: '/pint 4' } });
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      await bot.handlers['pint'](ctx);

      expect(useCases.registerDrinks.execute).toHaveBeenCalledWith(
        expect.objectContaining({ telegramUserId: 123456 }),
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Enregistre'),
      );
    });

    it('refuse si non lie', async () => {
      useCases.resolveUser.execute.mockResolvedValue(null);
      const ctx = mockContext({ message: { text: '/pint' } });
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      await bot.handlers['pint'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('non lie'),
      );
    });
  });

  describe('handleTextMessage — email linking', () => {
    it('lie le compte apres /start puis email', async () => {
      useCases.resolveUser.execute.mockResolvedValue(null);
      const startCtx = mockContext();
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      await bot.handlers['start'](startCtx);

      const link = TelegramLink.fromPersistence({
        id: 'link-1',
        telegramUserId: 123456,
        userId: 'user-1',
        linkedAt: new Date(),
      });
      useCases.linkUser.execute.mockResolvedValue({
        link,
        firstName: 'Jean',
      });
      const emailCtx = mockContext({ message: { text: 'test@example.com' } });
      const textHandler = bot.messageHandlers.find(
        ([e]) => e === 'message:text',
      );
      await textHandler![1](emailCtx);

      expect(useCases.linkUser.execute).toHaveBeenCalledWith({
        telegramUserId: 123456,
        email: 'test@example.com',
      });
      expect(emailCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Jean'),
      );
    });
  });

  describe('handleTextMessage — NLP', () => {
    it('enregistre "2 bieres" si confiant', async () => {
      useCases.resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      useCases.registerDrinks.execute.mockResolvedValue([]);
      const ctx = mockContext({ message: { text: '2 bieres' } });
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      const textHandler = bot.messageHandlers.find(
        ([e]) => e === 'message:text',
      );
      await textHandler![1](ctx);

      expect(useCases.registerDrinks.execute).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Enregistre'),
      );
    });

    it('affiche le clavier si non confiant', async () => {
      useCases.resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      const ctx = mockContext({ message: { text: 'hello world' } });
      const bot = createMockBot();
      handler.register(
        bot as unknown as Parameters<typeof handler.register>[0],
      );
      const textHandler = bot.messageHandlers.find(
        ([e]) => e === 'message:text',
      );
      await textHandler![1](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('pas compris'),
        expect.objectContaining({ reply_markup: expect.anything() }),
      );
    });
  });

  describe('formatConfirmation', () => {
    it('formate les pintes avec les verres standard', () => {
      const msg = handler.formatConfirmation([
        {
          category: 'alcohol',
          quantity: 8,
          unit: 'standard_drink',
          source: 'pint',
          displayCount: 4,
        },
      ]);
      expect(msg).toContain('4 pintes');
      expect(msg).toContain('8 verres standard');
    });

    it('formate un message combine', () => {
      const msg = handler.formatConfirmation([
        {
          category: 'alcohol',
          quantity: 2,
          unit: 'standard_drink',
          source: 'pint',
          displayCount: 1,
        },
        {
          category: 'coffee',
          quantity: 2,
          unit: 'cup',
          source: 'coffee',
          displayCount: 2,
        },
      ]);
      expect(msg).toContain('pintes');
      expect(msg).toContain('cafes');
    });
  });
});
