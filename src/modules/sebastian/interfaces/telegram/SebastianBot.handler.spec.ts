import { SebastianBotHandler } from './SebastianBot.handler';
import type { LinkTelegramUserUseCase } from '../../application/services/LinkTelegramUser.useCase';
import type { ResolveTelegramUserUseCase } from '../../application/services/ResolveTelegramUser.useCase';
import type { RegisterDrinksFromTelegramUseCase } from '../../application/services/RegisterDrinksFromTelegram.useCase';

/* eslint-disable @typescript-eslint/no-unsafe-argument */
type AnyFn = (...args: any[]) => any;

function mockContext(overrides: Record<string, unknown> = {}): any {
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

function createMockBot(): {
  command: jest.Mock;
  on: jest.Mock;
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
    handlers,
    messageHandlers,
  };
}

describe('SebastianBotHandler', () => {
  let handler: SebastianBotHandler;
  let linkUser: jest.Mocked<Pick<LinkTelegramUserUseCase, 'execute'>>;
  let resolveUser: jest.Mocked<Pick<ResolveTelegramUserUseCase, 'execute'>>;
  let registerDrinks: jest.Mocked<
    Pick<RegisterDrinksFromTelegramUseCase, 'execute'>
  >;

  beforeEach(() => {
    linkUser = { execute: jest.fn() };
    resolveUser = { execute: jest.fn() };
    registerDrinks = { execute: jest.fn() };
    handler = new SebastianBotHandler(
      linkUser as unknown as LinkTelegramUserUseCase,
      resolveUser as unknown as ResolveTelegramUserUseCase,
      registerDrinks as unknown as RegisterDrinksFromTelegramUseCase,
    );
  });

  describe('handleStart', () => {
    it("demande l'email si non lie", async () => {
      resolveUser.execute.mockResolvedValue(null);
      const ctx = mockContext();
      const bot = createMockBot();
      handler.register(bot as any);
      await bot.handlers['start'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('email'));
    });

    it('informe si deja lie', async () => {
      resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      const ctx = mockContext();
      const bot = createMockBot();
      handler.register(bot as any);
      await bot.handlers['start'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('deja lie'),
      );
    });
  });

  describe('handleDrinkCommand', () => {
    it('enregistre /pint 4 et confirme', async () => {
      resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      registerDrinks.execute.mockResolvedValue([]);
      const ctx = mockContext({ message: { text: '/pint 4' } });
      const bot = createMockBot();
      handler.register(bot as any);
      await bot.handlers['pint'](ctx);

      expect(registerDrinks.execute).toHaveBeenCalledWith(
        expect.objectContaining({ telegramUserId: 123456 }),
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Enregistre'),
      );
    });

    it('refuse si non lie', async () => {
      resolveUser.execute.mockResolvedValue(null);
      const ctx = mockContext({ message: { text: '/pint' } });
      const bot = createMockBot();
      handler.register(bot as any);
      await bot.handlers['pint'](ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('non lie'),
      );
    });
  });

  describe('handleTextMessage — email linking', () => {
    it('lie le compte apres /start puis email', async () => {
      resolveUser.execute.mockResolvedValue(null);
      const startCtx = mockContext();
      const bot = createMockBot();
      handler.register(bot as any);
      await bot.handlers['start'](startCtx);

      linkUser.execute.mockResolvedValue({
        link: {
          id: 'link-1',
          telegramUserId: 123456,
          userId: 'user-1',
          linkedAt: new Date(),
        } as any,
        firstName: 'Jean',
      });
      const emailCtx = mockContext({ message: { text: 'test@example.com' } });
      const textHandler = bot.messageHandlers.find(
        ([e]) => e === 'message:text',
      );
      await textHandler![1](emailCtx);

      expect(linkUser.execute).toHaveBeenCalledWith({
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
      resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      registerDrinks.execute.mockResolvedValue([]);
      const ctx = mockContext({ message: { text: '2 bieres' } });
      const bot = createMockBot();
      handler.register(bot as any);
      const textHandler = bot.messageHandlers.find(
        ([e]) => e === 'message:text',
      );
      await textHandler![1](ctx);

      expect(registerDrinks.execute).toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Enregistre'),
      );
    });

    it('affiche le clavier si non confiant', async () => {
      resolveUser.execute.mockResolvedValue({ userId: 'user-1' });
      const ctx = mockContext({ message: { text: 'hello world' } });
      const bot = createMockBot();
      handler.register(bot as any);
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
      expect(msg).toContain('4 pinte(s)');
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
      expect(msg).toContain('pinte(s)');
      expect(msg).toContain('cafe(s)');
    });
  });
});
