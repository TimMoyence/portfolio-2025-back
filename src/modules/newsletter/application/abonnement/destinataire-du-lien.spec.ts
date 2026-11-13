import {
  buildAbonne,
  buildCommandeDAbonnement,
  createNewsletterDependances,
} from '../../../../../test/factories/diffusion/newsletter.factory';
import {
  rendueAuPlancher,
  simulerLHorlogeAChaqueTest,
} from '../../../../../test/helpers/temps/plancher-de-latence';
import { SubscribeNewsletterUseCase } from '../SubscribeNewsletter.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');

describe('SubscribeNewsletterUseCase · destinataire du lien', () => {
  simulerLHorlogeAChaqueTest();

  it('NL-06 NL-09 · envoie le lien d un abonne connu a son adresse enregistree, pas a l alias saisi', async () => {
    jest.setSystemTime(MAINTENANT.getTime());
    const { depot, mailer } = createNewsletterDependances();
    depot.trouverParBoite.mockResolvedValue(
      buildAbonne({
        email: 'jane@mail.com',
        boite: 'jane@mail.com',
        status: 'unsubscribed',
        dernierMailLe: new Date(MAINTENANT.getTime() - 60 * 60_000),
      }),
    );

    await rendueAuPlancher(
      new SubscribeNewsletterUseCase(depot, mailer).execute(
        buildCommandeDAbonnement({ email: 'jane+autre@mail.com' }),
      ),
    );

    expect(
      mailer.envoyerLaConfirmation.mock.calls.map(([envoi]) => envoi.email),
    ).toEqual(['jane@mail.com']);
  });
});
