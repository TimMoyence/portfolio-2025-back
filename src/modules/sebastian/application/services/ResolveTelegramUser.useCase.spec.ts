import { ResolveTelegramUserUseCase } from './ResolveTelegramUser.useCase';
import {
  buildTelegramLink,
  createMockTelegramLinkRepo,
} from '../../../../../test/factories/telegram.factory';

describe('ResolveTelegramUserUseCase', () => {
  let useCase: ResolveTelegramUserUseCase;
  let repo: ReturnType<typeof createMockTelegramLinkRepo>;

  beforeEach(() => {
    repo = createMockTelegramLinkRepo();
    useCase = new ResolveTelegramUserUseCase(repo);
  });

  it('retourne le userId si le lien existe', async () => {
    const link = buildTelegramLink({
      telegramUserId: 123456,
      userId: 'user-1',
    });
    repo.findByTelegramUserId.mockResolvedValue(link);

    const result = await useCase.execute(123456);

    expect(result).toEqual({ userId: 'user-1' });
  });

  it("retourne null si le lien n'existe pas", async () => {
    repo.findByTelegramUserId.mockResolvedValue(null);

    const result = await useCase.execute(999999);

    expect(result).toBeNull();
  });
});
