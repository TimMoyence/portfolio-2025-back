/* eslint-disable @typescript-eslint/unbound-method */
import { RateLimitExceededError } from '../src/common/domain/errors/RateLimitExceededError';
import { boiteDeLivraison } from '../src/common/domain/value-objects/boite-de-livraison';
import { CreateAuditRequestsUseCase } from '../src/modules/audit-requests/application/CreateAuditRequests.useCase';
import type { CreateAuditRequestCommand } from '../src/modules/audit-requests/application/dto/CreateAuditRequest.command';
import { SelfAuditGuard } from '../src/modules/audit-requests/domain/SelfAuditGuard';
import { AuditRequestsRepositoryTypeORM } from '../src/modules/audit-requests/infrastructure/AuditRequests.repository.typeORM';
import { AuditRequestEntity } from '../src/modules/audit-requests/infrastructure/entities/AuditRequest.entity';
import { RequestToolkitUseCase } from '../src/modules/lead-magnets/application/RequestToolkit.useCase';
import { LeadMagnetRequestEntity } from '../src/modules/lead-magnets/infrastructure/entities/LeadMagnetRequest.entity';
import { LeadMagnetRequestRepositoryTypeORM } from '../src/modules/lead-magnets/infrastructure/LeadMagnetRequest.repository.typeorm';
import { SubscribeNewsletterUseCase } from '../src/modules/newsletter/application/SubscribeNewsletter.useCase';
import {
  DAILY_BRIEF_SOURCE,
  SUPPORTED_FORMATION_SLUGS,
} from '../src/modules/newsletter/domain/SupportedFormationSlugs';
import { NewsletterSubscriberEntity } from '../src/modules/newsletter/infrastructure/entities/NewsletterSubscriber.entity';
import { NewsletterSubscriberRepositoryTypeORM } from '../src/modules/newsletter/infrastructure/NewsletterSubscriber.repository.typeorm';
import {
  buildAuditRequest,
  createMockAuditNotifier,
  createMockAuditQueue,
} from './factories/audit-requests.factory';
import {
  createMockLeadMagnetNotifier,
  createMockToolkitContentAssembler,
  createMockToolkitPdfGenerator,
} from './factories/lead-magnet-request.factory';
import {
  buildNewsletterSubscriber,
  createMockNewsletterMailer,
} from './factories/newsletter-subscriber.factory';
import { ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255 } from './factories/verrou-par-boite.factory';
import {
  baseMigreeDeLaSuite,
  describeDb,
  TOUTES_LES_ENTITES,
  TOUTES_LES_MIGRATIONS,
} from './helpers/db-integration-datasource';
import { flushPromises } from './helpers/flush-promises';

const MINUTE_MS = 60 * 1000;
const HEURE_MS = 60 * MINUTE_MS;
const FUSEAU_ELOIGNE_DE_L_API = 'Pacific/Honolulu';

describeDb('Plafonds par destinataire sur une base migree', () => {
  const base = baseMigreeDeLaSuite(
    [TOUTES_LES_ENTITES],
    [TOUTES_LES_MIGRATIONS],
    FUSEAU_ELOIGNE_DE_L_API,
  );

  const ilYA = (minutes: number) => new Date(Date.now() - minutes * MINUTE_MS);

  const issuesDe = <T>(demandes: readonly (() => Promise<T>)[]) =>
    Promise.allSettled(demandes.map((demande) => demande()));

  const refusDe = async (demande: Promise<unknown>) => {
    const refus: unknown = await demande.then(
      () => null,
      (erreur: unknown) => erreur,
    );
    expect(refus).toBeInstanceOf(RateLimitExceededError);
    return refus as RateLimitExceededError;
  };

  describe('audit', () => {
    const depotDAudit = () =>
      new AuditRequestsRepositoryTypeORM(
        base().getRepository(AuditRequestEntity),
      );

    const auditSurLaBase = () => {
      const queue = createMockAuditQueue();
      queue.enqueue.mockResolvedValue(undefined);
      const notifier = createMockAuditNotifier();
      notifier.sendAuditNotification.mockResolvedValue(undefined);
      return {
        queue,
        notifier,
        useCase: new CreateAuditRequestsUseCase(
          depotDAudit(),
          queue,
          notifier,
          new SelfAuditGuard(['asilidesign.fr']),
        ),
      };
    };

    const demande = (contactValue: string): CreateAuditRequestCommand => ({
      websiteName: 'example.com',
      contactMethod: 'EMAIL',
      contactValue,
      locale: 'fr',
    });

    const adressesSaisiesVers = async (boite: string) => {
      const lignes: { contactValue: string }[] = await base().query(
        `SELECT "contactValue" FROM audit_requests WHERE boite = $1 ORDER BY created_at`,
        [boite],
      );
      return lignes.map(({ contactValue }) => contactValue);
    };

    it('rend, sur l horloge de la base et quel que soit le fuseau de l API, les secondes avant la sortie de fenetre des demandes vers une boite', async () => {
      const depot = depotDAudit();
      await depot.create(
        buildAuditRequest({ contactValue: 'plafond@exemple.fr' }),
      );
      await base().query(
        `UPDATE audit_requests SET created_at = LOCALTIMESTAMP - interval '2 hours' WHERE "contactValue" = $1`,
        ['plafond@exemple.fr'],
      );
      for (const contactValue of [
        'plafond@exemple.fr',
        'plafond+relance@exemple.fr',
        'autre@exemple.fr',
      ]) {
        await depot.create(buildAuditRequest({ contactValue }));
      }

      const dansLHeure = await depot.secondesAvantLaSortieDesDemandesVers(
        'plafond@exemple.fr',
        HEURE_MS,
      );
      const dansLesTroisHeures =
        await depot.secondesAvantLaSortieDesDemandesVers(
          'Plafond@Exemple.fr',
          3 * HEURE_MS,
        );

      expect(dansLHeure).toHaveLength(2);
      for (const secondes of dansLHeure) {
        expect(secondes).toBeGreaterThan(3590);
        expect(secondes).toBeLessThanOrEqual(3600);
      }
      expect(dansLesTroisHeures).toHaveLength(3);
      expect(dansLesTroisHeures[0]).toBeGreaterThan(3590);
      expect(dansLesTroisHeures[0]).toBeLessThanOrEqual(3600);
      for (const secondes of dansLesTroisHeures.slice(1)) {
        expect(secondes).toBeGreaterThan(10790);
        expect(secondes).toBeLessThanOrEqual(10800);
      }
      await expect(
        depot.secondesAvantLaSortieDesDemandesVers(
          'inconnu@exemple.fr',
          HEURE_MS,
        ),
      ).resolves.toEqual([]);
    });

    it('n accepte que 3 demandes sur 8 simultanees vers une meme boite, et ne met en file que celles-la', async () => {
      const { useCase, queue, notifier } = auditSurLaBase();

      const issues = await issuesDe(
        Array.from(
          { length: 8 },
          (_, rang) => () =>
            useCase.execute(
              demande(
                rang % 2
                  ? 'concurrence@exemple.fr'
                  : 'Concurrence+bis@exemple.fr',
              ),
            ),
        ),
      );

      const refus = issues.filter((issue) => issue.status === 'rejected');
      expect(
        issues.filter((issue) => issue.status === 'fulfilled'),
      ).toHaveLength(3);
      expect(refus).toHaveLength(5);
      for (const issue of refus) {
        expect(issue.reason).toBeInstanceOf(RateLimitExceededError);
      }
      await expect(
        adressesSaisiesVers('concurrence@exemple.fr'),
      ).resolves.toHaveLength(3);
      expect(queue.enqueue).toHaveBeenCalledTimes(3);
      expect(notifier.sendAuditNotification).toHaveBeenCalledTimes(3);
    });

    it('refuse en 429 les variantes d une boite deja servie trois fois dans l heure, et garde l adresse saisie de chaque demande', async () => {
      const { useCase } = auditSurLaBase();
      for (const saisie of [
        'victime@gmail.com',
        'victime+rapport@gmail.com',
        'Vic.Time@gmail.com',
      ]) {
        await useCase.execute(demande(saisie));
      }

      for (const variante of [
        'victime+1@gmail.com',
        'vic.time@gmail.com',
        'VICTIME@googlemail.com',
      ]) {
        await refusDe(useCase.execute(demande(variante)));
      }
      await expect(adressesSaisiesVers('victime@gmail.com')).resolves.toEqual([
        'victime@gmail.com',
        'victime+rapport@gmail.com',
        'vic.time@gmail.com',
      ]);
    });

    it('fait attendre, sur l horloge de la base, jusqu a la sortie de fenetre de la plus ancienne des trois demandes', async () => {
      const { useCase } = auditSurLaBase();
      const cible = 'attente@exemple.fr';
      for (let rang = 0; rang < 3; rang++) {
        await useCase.execute(demande(cible));
      }
      await base().query(
        `UPDATE audit_requests SET created_at = LOCALTIMESTAMP - interval '50 minutes'
         WHERE id = (SELECT id FROM audit_requests WHERE boite = $1 ORDER BY created_at LIMIT 1)`,
        [cible],
      );

      const refus = await refusDe(useCase.execute(demande(cible)));

      expect(refus.secondesAvantDeReessayer).toBeGreaterThan(595);
      expect(refus.secondesAvantDeReessayer).toBeLessThanOrEqual(600);
    });

    it('accepte trois demandes successives et refuse la quatrieme (temoin sequentiel)', async () => {
      const { useCase } = auditSurLaBase();
      const cible = 'sequentiel@exemple.fr';
      for (let rang = 0; rang < 3; rang++) {
        await useCase.execute(demande(cible));
      }

      await refusDe(useCase.execute(demande(cible)));
      await expect(adressesSaisiesVers(cible)).resolves.toHaveLength(3);
    });
  });

  describe('newsletter', () => {
    const depotNewsletter = () =>
      new NewsletterSubscriberRepositoryTypeORM(
        base().getRepository(NewsletterSubscriberEntity),
      );

    const inscrire = (
      email: string,
      sourceFormationSlug: string,
      lastConfirmationSentAt: Date | null,
    ) =>
      depotNewsletter().create(
        buildNewsletterSubscriber({
          email,
          sourceFormationSlug,
          lastConfirmationSentAt,
        }),
      );

    const newsletterSurLaBase = () => {
      const mailer = createMockNewsletterMailer();
      return {
        mailer,
        useCase: new SubscribeNewsletterUseCase(depotNewsletter(), mailer),
      };
    };

    const commande = (email: string, sourceFormationSlug: string) => ({
      email,
      firstName: 'Lea',
      locale: 'fr',
      sourceFormationSlug,
      termsVersion: '2026-04-10',
      termsAcceptedAt: new Date(),
    });

    const confirmationsDesInscriptionsSimultanees = async (
      emails: readonly string[],
    ) => {
      const { useCase, mailer } = newsletterSurLaBase();
      await Promise.all(
        emails.map((email) =>
          useCase.execute(commande(email, 'ia-solopreneurs')),
        ),
      );
      await flushPromises();
      return mailer.sendConfirmation;
    };

    it('retrouve la ligne de l adresse dont la confirmation est partie le plus recemment, toutes sources confondues', async () => {
      const depot = depotNewsletter();
      await inscrire('lea@exemple.fr', 'ia-solopreneurs', ilYA(30));
      const recente = await inscrire(
        'lea@exemple.fr',
        'automatiser-avec-ia',
        ilYA(5),
      );
      await inscrire('lea@exemple.fr', DAILY_BRIEF_SOURCE, null);
      await inscrire('autre@exemple.fr', 'ia-solopreneurs', ilYA(1));
      await inscrire('jamais@exemple.fr', 'ia-solopreneurs', null);

      await expect(
        depot.derniereConfirmationVersLaBoiteDe('lea@exemple.fr'),
      ).resolves.toMatchObject({
        id: recente.id,
        sourceFormationSlug: 'automatiser-avec-ia',
      });
      await expect(
        depot.derniereConfirmationVersLaBoiteDe('jamais@exemple.fr'),
      ).resolves.toBeNull();
      await expect(
        depot.derniereConfirmationVersLaBoiteDe('inconnu@exemple.fr'),
      ).resolves.toBeNull();
    });

    it('retrouve la derniere confirmation et les sources d une boite depuis chacune de ses variantes', async () => {
      const depot = depotNewsletter();
      await inscrire('noa@gmail.com', 'ia-solopreneurs', ilYA(30));
      const recente = await inscrire(
        'n.oa+veille@gmail.com',
        DAILY_BRIEF_SOURCE,
        ilYA(2),
      );

      for (const variante of [
        'noa@gmail.com',
        'NOA+1@googlemail.com',
        'n.o.a@gmail.com',
      ]) {
        await expect(
          depot.derniereConfirmationVersLaBoiteDe(variante),
        ).resolves.toMatchObject({ id: recente.id });
        await expect(
          depot.boiteInscriteA(variante, 'ia-solopreneurs'),
        ).resolves.toBe(true);
        await expect(
          depot.boiteInscriteA(variante, 'automatiser-avec-ia'),
        ).resolves.toBe(false);
      }
    });

    it('n envoie qu une confirmation pour 6 inscriptions simultanees sur 3 sources en attente eligibles d une boite', async () => {
      const email = 'nl-concurrence@exemple.fr';
      for (const source of SUPPORTED_FORMATION_SLUGS) {
        await inscrire(email, source, ilYA(30));
      }
      const { useCase, mailer } = newsletterSurLaBase();

      await Promise.all(
        [...SUPPORTED_FORMATION_SLUGS, ...SUPPORTED_FORMATION_SLUGS].map(
          (source, rang) =>
            useCase.execute(
              commande(rang % 2 ? email : 'NL-Concurrence@exemple.fr', source),
            ),
        ),
      );
      await flushPromises();

      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
    });

    it('n envoie qu une confirmation pour 4 inscriptions simultanees sur une seule source en attente eligible', async () => {
      const email = 'nl-une-source@exemple.fr';
      await inscrire(email, 'ia-solopreneurs', ilYA(30));

      const confirmations = await confirmationsDesInscriptionsSimultanees(
        Array.from({ length: 4 }, () => email),
      );

      expect(confirmations).toHaveBeenCalledTimes(1);
    });

    it('n envoie qu une confirmation pour 4 inscriptions simultanees de variantes d une boite sur une source en attente eligible', async () => {
      await inscrire('rafale@gmail.com', 'ia-solopreneurs', ilYA(30));

      const confirmations = await confirmationsDesInscriptionsSimultanees([
        'rafale+1@gmail.com',
        'r.afale@gmail.com',
        'RAFALE@googlemail.com',
        'ra.fale+2@gmail.com',
      ]);

      expect(confirmations).toHaveBeenCalledTimes(1);
    });

    it('bloque une deuxieme source eligible dans les 10 min de la premiere confirmation (temoin sequentiel)', async () => {
      const email = 'nl-sequentiel@exemple.fr';
      await inscrire(email, 'ia-solopreneurs', ilYA(30));
      await inscrire(email, 'automatiser-avec-ia', ilYA(30));
      const { useCase, mailer } = newsletterSurLaBase();

      await useCase.execute(commande(email, 'ia-solopreneurs'));
      await useCase.execute(commande(email, 'automatiser-avec-ia'));
      await flushPromises();

      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
    });

    it('n envoie rien aux variantes d une boite confirmee il y a une minute pour la meme source, mais confirme toujours une source neuve', async () => {
      await inscrire('lea@gmail.com', 'ia-solopreneurs', ilYA(1));
      const { useCase, mailer } = newsletterSurLaBase();

      for (const variante of [
        'lea+1@gmail.com',
        'lea+2@gmail.com',
        'l.ea@gmail.com',
      ]) {
        await expect(
          useCase.execute(commande(variante, 'ia-solopreneurs')),
        ).resolves.toMatchObject({ created: true });
      }
      await flushPromises();
      expect(mailer.sendConfirmation).not.toHaveBeenCalled();

      await useCase.execute(commande('lea+3@gmail.com', 'automatiser-avec-ia'));
      await flushPromises();
      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
      expect(mailer.sendConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'lea+3@gmail.com',
          sourceFormationSlug: 'automatiser-avec-ia',
        }),
      );
    });

    it('inscrit et confirme une adresse dont la boite en punycode depasse 255 caracteres', async () => {
      const { useCase, mailer } = newsletterSurLaBase();

      await expect(
        useCase.execute(
          commande(ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255, 'ia-solopreneurs'),
        ),
      ).resolves.toMatchObject({ created: true });
      await flushPromises();

      expect(mailer.sendConfirmation).toHaveBeenCalledTimes(1);
    });
  });

  describe('boite a outils', () => {
    const boiteAOutilsSurLaBase = () => {
      const notifier = createMockLeadMagnetNotifier();
      return {
        notifier,
        useCase: new RequestToolkitUseCase(
          new LeadMagnetRequestRepositoryTypeORM(
            base().getRepository(LeadMagnetRequestEntity),
          ),
          notifier,
          createMockToolkitPdfGenerator(),
          createMockToolkitContentAssembler(),
        ),
      };
    };

    const demande = (email: string) => ({
      firstName: 'Ines',
      email,
      formationSlug: 'ia-solopreneurs',
      termsVersion: '2026-04-10',
      termsLocale: 'fr',
      termsAcceptedAt: new Date(),
    });

    const demandesVers = async (boite: string) => {
      const [{ n }]: { n: string }[] = await base().query(
        `SELECT count(*)::text AS n FROM lead_magnet_requests WHERE boite = $1`,
        [boite],
      );
      return Number(n);
    };

    it('ne cree qu une demande et un envoi pour 5 demandes simultanees vers une boite, puis aucune pour une variante dans les 24 h', async () => {
      const { useCase, notifier } = boiteAOutilsSurLaBase();

      await Promise.all(
        Array.from({ length: 5 }, () =>
          useCase.execute(demande('ines@gmail.com')),
        ),
      );
      await useCase.execute(demande('i.nes+outils@googlemail.com'));
      await flushPromises();

      await expect(demandesVers('ines@gmail.com')).resolves.toBe(1);
      expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
    });

    it('ne cree qu une demande et un envoi pour 4 demandes simultanees de variantes d une boite', async () => {
      const { useCase, notifier } = boiteAOutilsSurLaBase();

      await Promise.all(
        [
          'outils@gmail.com',
          'o.utils@gmail.com',
          'OUTILS+1@googlemail.com',
          'ou.tils+2@gmail.com',
        ].map((variante) => useCase.execute(demande(variante))),
      );
      await flushPromises();

      await expect(demandesVers('outils@gmail.com')).resolves.toBe(1);
      expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
    });

    it('cree la demande et l envoi d une adresse dont la boite en punycode depasse 255 caracteres', async () => {
      const { useCase, notifier } = boiteAOutilsSurLaBase();

      await useCase.execute(demande(ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255));
      await flushPromises();

      await expect(
        demandesVers(boiteDeLivraison(ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255)),
      ).resolves.toBe(1);
      expect(notifier.sendToolkitEmail).toHaveBeenCalledTimes(1);
    });
  });
});
