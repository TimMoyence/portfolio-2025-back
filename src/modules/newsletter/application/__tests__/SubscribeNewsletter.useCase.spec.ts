/* eslint-disable @typescript-eslint/unbound-method */
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import {
  buildAbonnePersiste,
  buildSubscribeNewsletterCommand,
  createMockNewsletterMailer,
  createMockNewsletterSubscriberRepo,
} from '../../../../../test/factories/newsletter-subscriber.factory';
import { sectionSurLeDepot } from '../../../../../test/factories/verrou-par-boite.factory';
import {
  attendreLAvertissement,
  espionnerLesAvertissements,
} from '../../../../../test/helpers/avertissements';
import { flushPromises } from '../../../../../test/helpers/flush-promises';
import {
  reglementAuPlancher,
  RETENUE_JUSQU_AU_PLANCHER,
  simulerLHorlogeAChaqueTest,
} from '../../../../../test/helpers/plancher-de-latence';
import type { NewsletterSubscriber } from '../../domain/NewsletterSubscriber';
import { SubscribeNewsletterUseCase } from '../SubscribeNewsletter.useCase';
import type { SubscribeNewsletterCommand } from '../dto/SubscribeNewsletter.command';

const MINUTE_MS = 60 * 1000;

describe('SubscribeNewsletterUseCase', () => {
  const validCommand: SubscribeNewsletterCommand =
    buildSubscribeNewsletterCommand();

  const CREE_EN_ATTENTE = {
    created: true,
    alreadySubscribed: false,
    status: 'pending',
  };

  const DEJA_EN_ATTENTE = {
    created: false,
    alreadySubscribed: true,
    status: 'pending',
  };

  let repo: ReturnType<typeof createMockNewsletterSubscriberRepo>;
  let mailer: ReturnType<typeof createMockNewsletterMailer>;
  let useCase: SubscribeNewsletterUseCase;
  const avertissements = espionnerLesAvertissements();

  const souscrire = async () => {
    const result = await useCase.execute(validCommand);
    await flushPromises();
    return result;
  };

  const souscrireSurUnAbonne = async (
    preparer?: (abonne: NewsletterSubscriber) => void,
  ) => {
    const existing = buildAbonnePersiste(preparer);
    repo.findByEmailAndSource.mockResolvedValueOnce(existing);
    return { existing, result: await souscrire() };
  };

  beforeEach(() => {
    repo = createMockNewsletterSubscriberRepo();
    mailer = createMockNewsletterMailer();
    useCase = new SubscribeNewsletterUseCase(repo, mailer);
  });

  it('cree un abonne et envoie l’email de confirmation sur un email nouveau', async () => {
    const result = await souscrire();

    expect(result).toEqual(CREE_EN_ATTENTE);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("renvoie un email de confirmation sans recreer quand l'abonne est deja pending", async () => {
    const { existing, result } = await souscrireSurUnAbonne();

    expect(result).toEqual(DEJA_EN_ATTENTE);
    expect(repo.create).not.toHaveBeenCalled();
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(existing);
  });

  it.each([
    [
      'confirme',
      'confirmed',
      (abonne: NewsletterSubscriber) =>
        abonne.confirm(new Date('2026-04-10T11:00:00Z')),
    ],
    [
      'unsubscribed',
      'unsubscribed',
      (abonne: NewsletterSubscriber) => abonne.unsubscribe(),
    ],
  ])(
    'ne renvoie PAS d’email quand l’abonne est deja %s',
    async (_label, status, preparer) => {
      const { result } = await souscrireSurUnAbonne(preparer);

      expect(result).toEqual({ ...DEJA_EN_ATTENTE, status });
      expect(mailer.sendConfirmation).not.toHaveBeenCalled();
    },
  );

  it('journalise et ne propage pas un echec SMTP', async () => {
    mailer.sendConfirmation.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(souscrire()).resolves.toEqual(CREE_EN_ATTENTE);
    await attendreLAvertissement(
      avertissements,
      'Newsletter confirmation email failed: SMTP down',
    );
  });

  const perdreLaCourseFace = (raced: NewsletterSubscriber | null) => {
    repo.findByEmailAndSource
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(raced);
    repo.create.mockRejectedValueOnce(
      new ResourceConflictError('already exists'),
    );
  };

  it('absorbe une race condition `ResourceConflictError`', async () => {
    const raced = buildAbonnePersiste();
    perdreLaCourseFace(raced);

    const result = await souscrire();

    expect(result).toEqual(DEJA_EN_ATTENTE);
    expect(repo.findByEmailAndSource).toHaveBeenCalledTimes(2);
    expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledTimes(2);
    expect(mailer.sendConfirmation).toHaveBeenCalledWith(raced);
  });

  it('repond deja inscrit sans envoi quand la course rend un abonne confirme', async () => {
    perdreLaCourseFace(
      buildAbonnePersiste((abonne) =>
        abonne.confirm(new Date('2026-04-10T11:00:00Z')),
      ),
    );

    const result = await souscrire();

    expect(result).toEqual({ ...DEJA_EN_ATTENTE, status: 'confirmed' });
    expect(mailer.sendConfirmation).not.toHaveBeenCalled();
  });

  it('relance le conflit quand la relecture apres la course ne trouve personne', async () => {
    perdreLaCourseFace(null);

    await expect(useCase.execute(validCommand)).rejects.toBeInstanceOf(
      ResourceConflictError,
    );
    expect(mailer.sendConfirmation).not.toHaveBeenCalled();
  });

  it('relance une erreur autre que `ResourceConflictError`', async () => {
    repo.create.mockRejectedValueOnce(new Error('DB down'));
    await expect(useCase.execute(validCommand)).rejects.toThrow('DB down');
  });

  it.each([
    ['ne renvoie pas', 2, 0],
    ['renvoie', 15, 1],
  ])(
    '%s l’email a un pending re-souscrit %i min apres le dernier envoi (cooldown 10 min)',
    async (_label, minutes, envois) => {
      const { result } = await souscrireSurUnAbonne((abonne) =>
        abonne.markConfirmationSent(new Date(Date.now() - minutes * MINUTE_MS)),
      );

      expect(result.alreadySubscribed).toBe(true);
      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(envois);
    },
  );

  describe('delai entre deux confirmations, par boite de livraison et toutes sources confondues', () => {
    const notifieeIlYA = (minutes: number) =>
      buildAbonnePersiste((abonne) => {
        abonne.sourceFormationSlug = 'automatiser-avec-ia';
        abonne.markConfirmationSent(new Date(Date.now() - minutes * MINUTE_MS));
      });

    it.each([
      ['ne renvoie pas', 2, 0],
      ['renvoie', 15, 1],
    ])(
      '%s la confirmation d une source quand l adresse en a recu une pour une autre source il y a %i min',
      async (_label, minutes, envois) => {
        repo.derniereConfirmationVersLaBoiteDe.mockResolvedValueOnce(
          notifieeIlYA(minutes),
        );

        const { result } = await souscrireSurUnAbonne((abonne) =>
          abonne.markConfirmationSent(new Date(Date.now() - 30 * MINUTE_MS)),
        );

        expect(result).toEqual(DEJA_EN_ATTENTE);
        expect(repo.derniereConfirmationVersLaBoiteDe).toHaveBeenCalledWith(
          validCommand.email,
        );
        expect(mailer.sendConfirmation).toHaveBeenCalledTimes(envois);
      },
    );

    it('envoie toujours la premiere confirmation d une source neuve, meme juste apres celle d une autre source', async () => {
      repo.derniereConfirmationVersLaBoiteDe.mockResolvedValue(notifieeIlYA(1));

      await expect(souscrire()).resolves.toEqual(CREE_EN_ATTENTE);
      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['ne confirme pas', 1, 0],
      ['confirme', 15, 1],
    ])(
      '%s une adresse neuve d une boite deja inscrite a la source quand la boite a recu une confirmation il y a %i min',
      async (_label, minutes, envois) => {
        repo.boiteInscriteA.mockResolvedValueOnce(true);
        repo.derniereConfirmationVersLaBoiteDe.mockResolvedValueOnce(
          notifieeIlYA(minutes),
        );

        await expect(souscrire()).resolves.toEqual(CREE_EN_ATTENTE);

        expect(repo.boiteInscriteA).toHaveBeenCalledWith(
          validCommand.email,
          validCommand.sourceFormationSlug,
        );
        expect(repo.create).toHaveBeenCalledTimes(1);
        expect(repo.update).toHaveBeenCalledTimes(envois);
        expect(mailer.sendConfirmation).toHaveBeenCalledTimes(envois);
      },
    );
  });

  describe('section verrouillee de la boite', () => {
    let depotDeLaSection: ReturnType<typeof createMockNewsletterSubscriberRepo>;

    beforeEach(() => {
      depotDeLaSection = createMockNewsletterSubscriberRepo();
      repo.sousVerrouDeLaBoite = sectionSurLeDepot(
        () => depotDeLaSection,
        () => expect(mailer.sendConfirmation).not.toHaveBeenCalled(),
      );
    });

    const attendreRienHorsDeLaSection = () => {
      expect(repo.sousVerrouDeLaBoite).toHaveBeenCalledWith(
        validCommand.email,
        expect.any(Function),
      );
      expect(repo.findByEmailAndSource).not.toHaveBeenCalled();
      expect(repo.derniereConfirmationVersLaBoiteDe).not.toHaveBeenCalled();
      expect(repo.boiteInscriteA).not.toHaveBeenCalled();
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    };

    it('lit, decide et marque le renvoi dans la section, puis envoie apres sa fin', async () => {
      const existing = buildAbonnePersiste();
      depotDeLaSection.findByEmailAndSource.mockResolvedValueOnce(existing);

      await expect(souscrire()).resolves.toEqual(DEJA_EN_ATTENTE);

      attendreRienHorsDeLaSection();
      expect(
        depotDeLaSection.derniereConfirmationVersLaBoiteDe,
      ).toHaveBeenCalledWith(validCommand.email);
      expect(existing.lastConfirmationSentAt).not.toBeNull();
      expect(depotDeLaSection.update).toHaveBeenCalledWith(existing);
      expect(mailer.sendConfirmation).toHaveBeenCalledWith(existing);
    });

    it('cree et marque la premiere confirmation dans la section, puis envoie apres sa fin', async () => {
      await expect(souscrire()).resolves.toEqual(CREE_EN_ATTENTE);

      attendreRienHorsDeLaSection();
      expect(depotDeLaSection.boiteInscriteA).toHaveBeenCalledTimes(1);
      expect(depotDeLaSection.create).toHaveBeenCalledTimes(1);
      expect(depotDeLaSection.update).toHaveBeenCalledTimes(1);
      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
    });
  });

  it('fait tourner le confirmToken quand il est expire avant de renvoyer', async () => {
    let previousToken = '';
    const { existing } = await souscrireSurUnAbonne((abonne) => {
      abonne.confirmTokenExpiresAt = new Date(Date.now() - 24 * 60 * MINUTE_MS);
      previousToken = abonne.confirmToken;
    });

    expect(existing.confirmToken).not.toBe(previousToken);
    expect(existing.confirmTokenExpiresAt.getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(repo.update).toHaveBeenCalled();
  });

  it('persiste `lastConfirmationSentAt` apres un envoi (audit + cooldown)', async () => {
    const { existing } = await souscrireSurUnAbonne((abonne) =>
      expect(abonne.lastConfirmationSentAt).toBeNull(),
    );

    expect(existing.lastConfirmationSentAt).not.toBeNull();
    expect(repo.update).toHaveBeenCalledWith(existing);
  });

  describe('temps de reponse', () => {
    simulerLHorlogeAChaqueTest();

    it.each([
      ['un email nouveau', () => undefined],
      [
        'un abonne deja en attente',
        () =>
          repo.findByEmailAndSource.mockResolvedValueOnce(
            buildAbonnePersiste(),
          ),
      ],
    ])('repond pour %s au meme plancher de latence', async (_cas, preparer) => {
      preparer();

      expect(await reglementAuPlancher(useCase.execute(validCommand))).toEqual(
        RETENUE_JUSQU_AU_PLANCHER,
      );
    });
  });
});
