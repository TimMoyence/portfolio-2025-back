/* eslint-disable @typescript-eslint/unbound-method */
import { ConfigService } from '@nestjs/config';
import { RequestPasswordResetUseCase } from './RequestPasswordReset.useCase';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import {
  buildPasswordResetToken,
  createMockPasswordResetTokensRepo,
} from '../../../../test/factories/password-reset-token.factory';
import { createMockPasswordResetNotifier } from '../../../../test/factories/mailer.factory';

describe('RequestPasswordResetUseCase', () => {
  let usersRepository: ReturnType<typeof createMockUsersRepo>;
  let tokensRepository: ReturnType<typeof createMockPasswordResetTokensRepo>;
  let notifier: ReturnType<typeof createMockPasswordResetNotifier>;
  let configService: jest.Mocked<ConfigService>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    usersRepository = createMockUsersRepo();
    tokensRepository = createMockPasswordResetTokensRepo();
    notifier = createMockPasswordResetNotifier();
    configService = {
      get: jest.fn().mockReturnValue('https://example.com/reset-password'),
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new RequestPasswordResetUseCase(
      usersRepository,
      tokensRepository,
      notifier,
      configService,
    );
  });

  it('envoie un email de reset quand le compte existe', async () => {
    const user = buildUser({
      id: 'user-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: 'legacy-hash',
    });
    usersRepository.findByEmail.mockResolvedValue(user);
    tokensRepository.create.mockResolvedValue(buildPasswordResetToken());
    notifier.sendPasswordResetEmail.mockResolvedValue();

    const result = await useCase.execute({ email: user.email });

    expect(result.message).toContain('Si un compte existe');
    expect(tokensRepository.invalidateActiveByUserId).toHaveBeenCalledWith(
      user.id,
    );
    expect(tokensRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        usedAt: null,
      }),
    );

    const payload = notifier.sendPasswordResetEmail.mock.calls[0][0];
    expect(payload.email).toBe(user.email);
    expect(payload.firstName).toBe(user.firstName);
    expect(payload.lastName).toBe(user.lastName);
    expect(payload.expiresInMinutes).toBe(60);
    expect(payload.resetUrl).toMatch(/token=[0-9a-f]{64}/);
  });

  it('retourne un message generique quand le compte est introuvable', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'unknown@example.com' });

    expect(result.message).toContain('Si un compte existe');
    expect(tokensRepository.invalidateActiveByUserId).not.toHaveBeenCalled();
    expect(tokensRepository.create).not.toHaveBeenCalled();
    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('invalide les anciens jetons actifs et fixe une expiration a une heure', async () => {
    const user = buildUser({ id: 'user-1', passwordHash: 'hash' });
    usersRepository.findByEmail.mockResolvedValue(user);
    tokensRepository.create.mockResolvedValue(buildPasswordResetToken());
    notifier.sendPasswordResetEmail.mockResolvedValue();

    const before = Date.now();
    await useCase.execute({ email: user.email });
    const after = Date.now();

    const createdToken = tokensRepository.create.mock.calls[0][0];
    const expiresAtMs = createdToken.expiresAt.getTime();

    expect(expiresAtMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);
  });

  it('ne casse pas le flow si le mailer echoue', async () => {
    const user = buildUser({ id: 'user-1', passwordHash: 'hash' });
    usersRepository.findByEmail.mockResolvedValue(user);
    tokensRepository.create.mockResolvedValue(buildPasswordResetToken());
    notifier.sendPasswordResetEmail.mockRejectedValue(new Error('smtp down'));

    await expect(useCase.execute({ email: user.email })).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
