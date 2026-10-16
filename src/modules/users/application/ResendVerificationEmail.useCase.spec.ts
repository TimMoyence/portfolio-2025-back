/* eslint-disable @typescript-eslint/unbound-method */
import { createMockEmailVerificationTokensRepo } from '../../../../test/factories/email-verification-token.factory';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import type { User } from '../domain/User';
import { ResendVerificationEmailUseCase } from './ResendVerificationEmail.useCase';
import type { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';

describe('ResendVerificationEmailUseCase', () => {
  let usersRepo: ReturnType<typeof createMockUsersRepo>;
  let tokensRepo: ReturnType<typeof createMockEmailVerificationTokensRepo>;
  let envoi: jest.Mocked<Pick<EnvoiDeVerificationEmail, 'envoyer'>>;
  let useCase: ResendVerificationEmailUseCase;

  const compteNonVerifie = buildUser({ id: 'user-1', emailVerified: false });

  beforeEach(() => {
    usersRepo = createMockUsersRepo();
    tokensRepo = createMockEmailVerificationTokensRepo();
    envoi = { envoyer: jest.fn().mockResolvedValue(undefined) };
    useCase = new ResendVerificationEmailUseCase(
      usersRepo,
      tokensRepo,
      envoi as unknown as EnvoiDeVerificationEmail,
    );
  });

  const demanderAvec = (compte: User | null, demandesRecentes = 0) => {
    usersRepo.findByEmail.mockResolvedValue(compte);
    tokensRepo.countRecentByUserId.mockResolvedValue(demandesRecentes);
    return useCase.execute('marie@example.com');
  };

  it('renvoie un lien sans effacer les precedents sous la limite horaire', async () => {
    await demanderAvec(compteNonVerifie, 2);

    expect(tokensRepo.countRecentByUserId).toHaveBeenCalledWith(
      'user-1',
      60 * 60 * 1000,
    );
    expect(envoi.envoyer).toHaveBeenCalledWith(
      compteNonVerifie,
      'user-1',
      expect.anything(),
      'Resend verification email failed',
    );
    expect(tokensRepo.deleteByUserId).not.toHaveBeenCalled();
  });

  it('la quatrieme demande dans l heure repond comme le succes sans rien envoyer', async () => {
    const succes = await demanderAvec(compteNonVerifie, 2);
    envoi.envoyer.mockClear();

    const limite = await demanderAvec(compteNonVerifie, 3);

    expect(limite).toEqual(succes);
    expect(envoi.envoyer).not.toHaveBeenCalled();
  });

  it.each([
    ['un compte inconnu', null],
    ['un compte deja verifie', buildUser({ id: 'user-1' })],
    [
      'un compte inactif',
      buildUser({ id: 'user-1', emailVerified: false, isActive: false }),
    ],
  ])(
    'repond comme le succes sans rien envoyer pour %s',
    async (_label, compte) => {
      const succes = await demanderAvec(compteNonVerifie);
      envoi.envoyer.mockClear();

      await expect(demanderAvec(compte)).resolves.toEqual(succes);
      expect(envoi.envoyer).not.toHaveBeenCalled();
    },
  );
});
