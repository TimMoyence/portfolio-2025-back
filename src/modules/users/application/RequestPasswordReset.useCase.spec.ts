/* eslint-disable @typescript-eslint/unbound-method */
import type { PasswordResetToken } from '../domain/PasswordResetToken';
import { TROIS_ENVOIS_PAR_HEURE } from '../domain/PlafondDEnvois';
import type { User } from '../domain/User';
import { RequestPasswordResetUseCase } from './RequestPasswordReset.useCase';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import {
  buildPasswordResetToken,
  createMockPasswordResetTokensRepo,
} from '../../../../test/factories/password-reset-token.factory';
import { buildConfigService } from '../../../../test/factories/env.factory';
import { createMockPasswordResetNotifier } from '../../../../test/factories/mailer.factory';
import {
  promesseSuspendue,
  reglementAuPlancher,
  RETENUE_JUSQU_AU_PLANCHER,
  simulerLHorlogeAChaqueTest,
} from '../../../../test/helpers/plancher-de-latence';

const LEGACY_HASH = 'legacy-hash';

describe('RequestPasswordResetUseCase', () => {
  let usersRepository: ReturnType<typeof createMockUsersRepo>;
  let tokensRepository: ReturnType<typeof createMockPasswordResetTokensRepo>;
  let notifier: ReturnType<typeof createMockPasswordResetNotifier>;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(() => {
    usersRepository = createMockUsersRepo();
    tokensRepository = createMockPasswordResetTokensRepo();
    notifier = createMockPasswordResetNotifier();

    useCase = new RequestPasswordResetUseCase(
      usersRepository,
      tokensRepository,
      notifier,
      buildConfigService({
        PASSWORD_RESET_URL_BASE: 'https://example.com/reset-password',
      }),
    );
  });

  const compteExistant = (overrides: Partial<User>) => {
    const user = buildUser({ id: 'user-1', ...overrides });
    usersRepository.findByEmail.mockResolvedValue(user);
    tokensRepository.remplacerLesJetonsActifs.mockResolvedValue(
      buildPasswordResetToken(),
    );
    notifier.sendPasswordResetEmail.mockResolvedValue();
    return user;
  };

  it('envoie un email de reset quand le compte existe', async () => {
    const user = compteExistant({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      passwordHash: LEGACY_HASH,
    });

    const result = await useCase.execute({ email: user.email });

    expect(result.message).toContain('Si un compte existe');
    expect(tokensRepository.remplacerLesJetonsActifs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
      TROIS_ENVOIS_PAR_HEURE,
    );

    const payload = notifier.sendPasswordResetEmail.mock.calls[0][0];
    expect(payload.email).toBe(user.email);
    expect(payload.firstName).toBe(user.firstName);
    expect(payload.lastName).toBe(user.lastName);
    expect(payload.expiresInMinutes).toBe(60);
    expect(payload.resetUrl).toMatch(/token=[0-9a-f]{64}/);
  });

  it('repond comme le succes sans rien envoyer quand le plafond horaire du compte est atteint', async () => {
    const user = compteExistant({ passwordHash: 'hash' });
    const succes = await useCase.execute({ email: user.email });
    notifier.sendPasswordResetEmail.mockClear();
    tokensRepository.remplacerLesJetonsActifs.mockResolvedValue(null);

    await expect(useCase.execute({ email: user.email })).resolves.toEqual(
      succes,
    );
    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('retourne un message generique quand le compte est introuvable', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'unknown@example.com' });

    expect(result.message).toContain('Si un compte existe');
    expect(tokensRepository.remplacerLesJetonsActifs).not.toHaveBeenCalled();
    expect(notifier.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('invalide les anciens jetons actifs et fixe une expiration a une heure', async () => {
    const user = compteExistant({ passwordHash: 'hash' });

    const before = Date.now();
    await useCase.execute({ email: user.email });
    const after = Date.now();

    const createdToken =
      tokensRepository.remplacerLesJetonsActifs.mock.calls[0][0];
    const expiresAtMs = createdToken.expiresAt.getTime();

    expect(expiresAtMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);
  });

  it('annonce dans le courriel la duree de validite du jeton enregistre', async () => {
    const user = compteExistant({ passwordHash: 'hash' });

    const avant = Date.now();
    await useCase.execute({ email: user.email });
    const apres = Date.now();

    const { expiresAt } =
      tokensRepository.remplacerLesJetonsActifs.mock.calls[0][0];
    const { expiresInMinutes } =
      notifier.sendPasswordResetEmail.mock.calls[0][0];
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
      avant + expiresInMinutes * 60_000,
    );
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      apres + expiresInMinutes * 60_000,
    );
  });

  it('ne casse pas le flow si le mailer echoue', async () => {
    const user = compteExistant({ passwordHash: 'hash' });
    notifier.sendPasswordResetEmail.mockRejectedValue(new Error('smtp down'));

    await expect(useCase.execute({ email: user.email })).resolves.toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  describe('temps de reponse', () => {
    simulerLHorlogeAChaqueTest();

    it.each([
      [
        'un compte introuvable',
        () => usersRepository.findByEmail.mockResolvedValue(null),
      ],
      ['un compte existant', () => compteExistant({ passwordHash: 'hash' })],
      [
        'le plafond horaire du compte atteint',
        () => {
          compteExistant({ passwordHash: 'hash' });
          tokensRepository.remplacerLesJetonsActifs.mockResolvedValue(null);
        },
      ],
    ])('repond pour %s au meme plancher de latence', async (_cas, preparer) => {
      preparer();

      expect(
        await reglementAuPlancher(
          useCase.execute({ email: 'john@example.com' }),
        ),
      ).toEqual(RETENUE_JUSQU_AU_PLANCHER);
    });

    it('repond sans attendre la fin de l envoi du courriel', async () => {
      compteExistant({ passwordHash: 'hash' });
      notifier.sendPasswordResetEmail.mockReturnValue(
        new Promise<void>(() => undefined),
      );

      expect(
        await reglementAuPlancher(
          useCase.execute({ email: 'john@example.com' }),
        ),
      ).toEqual(RETENUE_JUSQU_AU_PLANCHER);
      expect(notifier.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it('repond au plancher quand le lien attend encore le verrou du compte, puis l envoie', async () => {
      compteExistant({ passwordHash: 'hash' });
      const verrou = promesseSuspendue<PasswordResetToken | null>();
      tokensRepository.remplacerLesJetonsActifs.mockReturnValue(
        verrou.promesse,
      );
      const reponse = useCase.execute({ email: 'john@example.com' });

      expect(await reglementAuPlancher(reponse)).toEqual(
        RETENUE_JUSQU_AU_PLANCHER,
      );
      await expect(reponse).resolves.toEqual({
        message:
          'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
      });
      verrou.liberer(buildPasswordResetToken());
      await jest.advanceTimersByTimeAsync(0);

      expect(notifier.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });
  });
});
