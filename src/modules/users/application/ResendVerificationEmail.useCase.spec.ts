/* eslint-disable @typescript-eslint/unbound-method */
import {
  buildEmailVerificationToken,
  createMockEmailVerificationTokensRepo,
} from '../../../../test/factories/email-verification-token.factory';
import { buildConfigService } from '../../../../test/factories/env.factory';
import { createMockEmailVerificationNotifier } from '../../../../test/factories/mailer.factory';
import {
  buildUser,
  createMockUsersRepo,
} from '../../../../test/factories/user.factory';
import {
  promesseSuspendue,
  rendueAuPlancher,
  simulerLHorlogeAChaqueTest,
} from '../../../../test/helpers/plancher-de-latence';
import { espionnerLeLoggerAChaqueTest } from '../../../../test/helpers/silence-nest-logger';
import type { EmailVerificationToken } from '../domain/EmailVerificationToken';
import type { IEmailVerificationNotifier } from '../domain/IEmailVerificationNotifier';
import { TROIS_ENVOIS_PAR_HEURE } from '../domain/PlafondDEnvois';
import type { User } from '../domain/User';
import { ResendVerificationEmailUseCase } from './ResendVerificationEmail.useCase';
import { EnvoiDeVerificationEmail } from './services/email-verification-dispatch';

describe('ResendVerificationEmailUseCase', () => {
  let usersRepo: ReturnType<typeof createMockUsersRepo>;
  let tokensRepo: ReturnType<typeof createMockEmailVerificationTokensRepo>;
  let notifier: jest.Mocked<IEmailVerificationNotifier>;
  let useCase: ResendVerificationEmailUseCase;
  const avertissements = espionnerLeLoggerAChaqueTest('warn');

  const compteNonVerifie = buildUser({
    id: 'user-1',
    email: 'marie@example.com',
    emailVerified: false,
  });

  beforeEach(() => {
    usersRepo = createMockUsersRepo();
    tokensRepo = createMockEmailVerificationTokensRepo();
    notifier = createMockEmailVerificationNotifier();
    useCase = new ResendVerificationEmailUseCase(
      usersRepo,
      new EnvoiDeVerificationEmail(
        tokensRepo,
        notifier,
        buildConfigService({
          EMAIL_VERIFICATION_URL_BASE: 'https://asilidesign.fr/verify-email',
        }),
      ),
    );
  });

  const demanderAvec = (compte: User | null, plafondAtteint = false) => {
    usersRepo.findByEmail.mockResolvedValue(compte);
    tokensRepo.remplacerLesJetonsActifs.mockResolvedValue(
      plafondAtteint ? null : buildEmailVerificationToken({ userId: 'user-1' }),
    );
    return useCase.execute('marie@example.com');
  };

  it('renvoie un lien sans effacer les precedents sous la limite horaire', async () => {
    await demanderAvec(compteNonVerifie);

    expect(tokensRepo.remplacerLesJetonsActifs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
      TROIS_ENVOIS_PAR_HEURE,
    );
    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'marie@example.com' }),
    );
    expect(tokensRepo.deleteByUserId).not.toHaveBeenCalled();
  });

  it('journalise l echec d envoi du renvoi sans le propager', async () => {
    notifier.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

    await demanderAvec(compteNonVerifie);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(avertissements()).toHaveBeenCalledWith(
      'Resend verification email failed for user user-1: smtp',
    );
  });

  it('la quatrieme demande dans l heure repond comme le succes sans rien envoyer', async () => {
    const succes = await demanderAvec(compteNonVerifie);
    notifier.sendVerificationEmail.mockClear();

    const limite = await demanderAvec(compteNonVerifie, true);

    expect(limite).toEqual(succes);
    expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
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
      notifier.sendVerificationEmail.mockClear();
      tokensRepo.remplacerLesJetonsActifs.mockClear();

      await expect(demanderAvec(compte)).resolves.toEqual(succes);
      expect(tokensRepo.remplacerLesJetonsActifs).not.toHaveBeenCalled();
      expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
    },
  );

  describe('temps de reponse', () => {
    simulerLHorlogeAChaqueTest();

    it.each([
      ['un envoi', compteNonVerifie, false],
      ['la limite horaire atteinte', compteNonVerifie, true],
      ['un compte inconnu', null, false],
    ])(
      'repond pour %s au meme plancher de latence',
      async (_cas, compte, plafondAtteint) => {
        await rendueAuPlancher(demanderAvec(compte, plafondAtteint));
      },
    );

    it('repond au plancher quand le lien attend encore le verrou du compte, puis l envoie', async () => {
      usersRepo.findByEmail.mockResolvedValue(compteNonVerifie);
      const verrou = promesseSuspendue<EmailVerificationToken | null>();
      tokensRepo.remplacerLesJetonsActifs.mockReturnValue(verrou.promesse);

      await expect(
        rendueAuPlancher(useCase.execute('marie@example.com')),
      ).resolves.toEqual({
        message:
          'Si un compte non verifie existe avec cet email, un nouveau lien de verification a ete envoye.',
      });
      verrou.liberer(buildEmailVerificationToken({ userId: 'user-1' }));
      await jest.advanceTimersByTimeAsync(0);

      expect(notifier.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });
  });
});
