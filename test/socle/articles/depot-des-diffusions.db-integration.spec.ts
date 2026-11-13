import type { NewsletterSubscriber } from '../../../src/modules/newsletter/domain/NewsletterSubscriber';
import { buildAbonne } from '../../factories/diffusion/newsletter.factory';
import { describeDb } from '../../helpers/base/db-integration-datasource';
import {
  articleProgramme,
  ENVOI_PREVU,
  suiteDeLaDiffusion,
} from '../../helpers/base/diffusion-en-base';

const AVANT = new Date('2026-09-23T05:44:59.999Z');

describeDb('Dépôt des diffusions (Postgres)', () => {
  const { base, diffusions, abonnes } = suiteDeLaDiffusion();

  const inscrire = (email: string, champs: Partial<NewsletterSubscriber>) =>
    abonnes().creer(
      buildAbonne({ email, boite: email, locale: 'en', ...champs }),
    );

  beforeEach(async () => {
    await articleProgramme(base(), 'en');
  });

  it('NL-04 · ne rend la diffusion qu a son heure', async () => {
    expect(await diffusions().prendreLaProchaineDue(AVANT)).toBeNull();
    expect(
      (await diffusions().prendreLaProchaineDue(ENVOI_PREVU))?.article.locale,
    ).toBe('en');
  });

  it('NL-20 NL-11 · ne rend que les abonnes confirmes de la langue, chacun une seule fois', async () => {
    await inscrire('jane@mail.com', { status: 'confirmed' });
    await inscrire('paul@mail.com', {
      locale: 'fr',
      status: 'confirmed',
      jetonDeDesabonnement: '1f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
    });
    await inscrire('eve@mail.com', {
      status: 'pending',
      jetonDeDesabonnement: '2f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
    });
    const id =
      (await diffusions().prendreLaProchaineDue(ENVOI_PREVU))?.id ?? '';

    const [jane, ...autres] = await diffusions().destinatairesEnAttente(
      id,
      'en',
      50,
    );
    expect(autres).toEqual([]);
    expect(jane.email).toBe('jane@mail.com');
    expect(await diffusions().reserver(id, jane.abonneId)).toBe(true);
    expect(await diffusions().reserver(id, jane.abonneId)).toBe(false);
    expect(await diffusions().destinatairesEnAttente(id, 'en', 50)).toEqual([]);
  });

  async function janeReservee(): Promise<{ id: string; abonneId: string }> {
    await inscrire('jane@mail.com', { status: 'confirmed' });
    const id =
      (await diffusions().prendreLaProchaineDue(ENVOI_PREVU))?.id ?? '';
    const [jane] = await diffusions().destinatairesEnAttente(id, 'en', 50);
    return { id, abonneId: jane.abonneId };
  }

  it('NL-20 · rend de nouveau un abonne dont la reservation est liberee, jamais un abonne deja servi', async () => {
    const { id, abonneId } = await janeReservee();
    await diffusions().reserver(id, abonneId);

    await diffusions().liberer(id, abonneId);
    const apresLiberation = await diffusions().destinatairesEnAttente(
      id,
      'en',
      50,
    );
    await diffusions().reserver(id, abonneId);
    await diffusions().marquerEnvoye(id, abonneId);
    await diffusions().liberer(id, abonneId);

    expect(apresLiberation.map((d) => d.abonneId)).toEqual([abonneId]);
    expect(await diffusions().destinatairesEnAttente(id, 'en', 50)).toEqual([]);
  });

  it.each([
    [
      'desabonne',
      `UPDATE "newsletter_subscribers" SET "status" = 'unsubscribed'`,
    ],
    [
      'passe dans l autre langue',
      `UPDATE "newsletter_subscribers" SET "locale" = 'fr'`,
    ],
    [
      'dont l article est retire',
      `UPDATE "articles" SET "status" = 'withdrawn'`,
    ],
  ])(
    'NL-05 NL-15 · ne reserve pas un abonne %s depuis la lecture du lot',
    async (_cas, changement) => {
      const { id, abonneId } = await janeReservee();
      await base().query(changement);

      expect(await diffusions().reserver(id, abonneId)).toBe(false);
      expect(
        await base().query('SELECT 1 FROM "article_broadcast_recipients"'),
      ).toEqual([]);
    },
  );

  it('NL-04 · ne rend plus une diffusion close', async () => {
    const diffusion = await diffusions().prendreLaProchaineDue(ENVOI_PREVU);
    await diffusions().cloturer(diffusion?.id ?? '');

    expect(await diffusions().prendreLaProchaineDue(ENVOI_PREVU)).toBeNull();
  });
});
