/* eslint-disable @typescript-eslint/unbound-method */
import { LinkTelegramUserUseCase } from './LinkTelegramUser.useCase';
import {
  buildTelegramLink,
  buildUser,
  createMockTelegramLinkRepo,
  createMockUsersRepo,
} from '../../../../../test/factories/telegram.factory';

describe('LinkTelegramUserUseCase', () => {
  let useCase: LinkTelegramUserUseCase;
  let telegramLinkRepo: ReturnType<typeof createMockTelegramLinkRepo>;
  let usersRepo: ReturnType<typeof createMockUsersRepo>;

  beforeEach(() => {
    telegramLinkRepo = createMockTelegramLinkRepo();
    usersRepo = createMockUsersRepo();
    useCase = new LinkTelegramUserUseCase(telegramLinkRepo, usersRepo);
  });

  it('lie un compte Telegram a un utilisateur existant', async () => {
    const user = buildUser({ roles: ['sebastian'] });
    usersRepo.findByEmail.mockResolvedValue(user);
    telegramLinkRepo.findByTelegramUserId.mockResolvedValue(null);
    telegramLinkRepo.create.mockImplementation((link) =>
      Promise.resolve({
        ...link,
        id: 'link-1',
      }),
    );

    const result = await useCase.execute({
      telegramUserId: 123456,
      email: 'test@example.com',
    });

    expect(result.firstName).toBe('Jean');
    expect(result.link.telegramUserId).toBe(123456);
    expect(result.link.userId).toBe('user-1');
    expect(telegramLinkRepo.create).toHaveBeenCalled();
  });

  it('retourne le lien existant si deja lie', async () => {
    const user = buildUser({ roles: ['sebastian'] });
    const existing = buildTelegramLink({
      telegramUserId: 123456,
      userId: 'user-1',
    });
    usersRepo.findByEmail.mockResolvedValue(user);
    telegramLinkRepo.findByTelegramUserId.mockResolvedValue(existing);

    const result = await useCase.execute({
      telegramUserId: 123456,
      email: 'test@example.com',
    });

    expect(result.link.id).toBe('link-1');
    expect(telegramLinkRepo.create).not.toHaveBeenCalled();
  });

  it("echoue si l'utilisateur n'existe pas", async () => {
    usersRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        telegramUserId: 123456,
        email: 'unknown@example.com',
      }),
    ).rejects.toThrow('Aucun utilisateur trouve');
  });

  it("echoue si l'utilisateur n'a pas le role sebastian", async () => {
    const user = buildUser({ roles: ['admin'] });
    usersRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({
        telegramUserId: 123456,
        email: 'test@example.com',
      }),
    ).rejects.toThrow("n'a pas acces a Sebastian");
  });
});
