import { RegisterDrinksFromTelegramUseCase } from './RegisterDrinksFromTelegram.useCase';
import { ResolveTelegramUserUseCase } from './ResolveTelegramUser.useCase';
import { AddEntryUseCase } from './AddEntry.useCase';
import { buildSebastianEntry } from '../../../../../test/factories/sebastian.factory';
import type { ParsedDrink } from '../../domain/drink-parser';

describe('RegisterDrinksFromTelegramUseCase', () => {
  let useCase: RegisterDrinksFromTelegramUseCase;
  let resolveTelegramUser: jest.Mocked<
    Pick<ResolveTelegramUserUseCase, 'execute'>
  >;
  let addEntry: jest.Mocked<Pick<AddEntryUseCase, 'execute'>>;

  beforeEach(() => {
    resolveTelegramUser = { execute: jest.fn() };
    addEntry = { execute: jest.fn() };

    useCase = new RegisterDrinksFromTelegramUseCase(
      resolveTelegramUser as unknown as ResolveTelegramUserUseCase,
      addEntry as unknown as AddEntryUseCase,
    );
  });

  it('enregistre plusieurs boissons pour un utilisateur lie', async () => {
    resolveTelegramUser.execute.mockResolvedValue({ userId: 'user-1' });
    addEntry.execute.mockImplementation((cmd) =>
      Promise.resolve(
        buildSebastianEntry({
          id: 'entry-' + cmd.category,
          userId: cmd.userId,
          category: cmd.category as 'coffee' | 'alcohol',
          quantity: cmd.quantity,
          notes: cmd.notes ?? null,
        }),
      ),
    );

    const drinks: ParsedDrink[] = [
      {
        category: 'alcohol',
        quantity: 8,
        unit: 'standard_drink',
        source: 'pint',
        displayCount: 4,
      },
      {
        category: 'coffee',
        quantity: 2,
        unit: 'cup',
        source: 'coffee',
        displayCount: 2,
      },
    ];

    const entries = await useCase.execute({
      telegramUserId: 123456,
      drinks,
    });

    expect(entries).toHaveLength(2);
    expect(addEntry.execute).toHaveBeenCalledTimes(2);
    expect(addEntry.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        category: 'alcohol',
        quantity: 8,
        notes: 'via Telegram',
      }),
    );
  });

  it("echoue si le compte Telegram n'est pas lie", async () => {
    resolveTelegramUser.execute.mockResolvedValue(null);

    await expect(
      useCase.execute({ telegramUserId: 999, drinks: [] }),
    ).rejects.toThrow('Compte Telegram non lie');
  });

  it('devrait propager consumedAt si present dans le ParsedDrink', async () => {
    resolveTelegramUser.execute.mockResolvedValue({ userId: 'user-1' });
    addEntry.execute.mockImplementation((cmd) =>
      Promise.resolve(
        buildSebastianEntry({
          id: 'entry-consumed',
          userId: cmd.userId,
          category: cmd.category as 'coffee' | 'alcohol',
          quantity: cmd.quantity,
          notes: cmd.notes ?? null,
        }),
      ),
    );

    const drinks: ParsedDrink[] = [
      {
        category: 'alcohol',
        quantity: 2,
        unit: 'standard_drink',
        source: 'beer',
        displayCount: 1,
        drinkType: 'beer',
        alcoholDegree: 5,
        volumeCl: 25,
        consumedAt: '2026-04-08T22:08:00.000Z',
      },
    ];

    await useCase.execute({ telegramUserId: 123456, drinks });

    expect(addEntry.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        date: '2026-04-08',
        consumedAt: '2026-04-08T22:08:00.000Z',
      }),
    );
  });

  it('ne devrait pas inclure consumedAt si absent du ParsedDrink', async () => {
    resolveTelegramUser.execute.mockResolvedValue({ userId: 'user-1' });
    addEntry.execute.mockImplementation((cmd) =>
      Promise.resolve(
        buildSebastianEntry({
          id: 'entry-no-consumed',
          userId: cmd.userId,
          category: cmd.category as 'coffee' | 'alcohol',
          quantity: cmd.quantity,
          notes: cmd.notes ?? null,
        }),
      ),
    );

    const drinks: ParsedDrink[] = [
      {
        category: 'coffee',
        quantity: 2,
        unit: 'cup',
        source: 'coffee',
        displayCount: 2,
      },
    ];

    await useCase.execute({ telegramUserId: 123456, drinks });

    const callArgs = addEntry.execute.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('consumedAt');
  });
});
