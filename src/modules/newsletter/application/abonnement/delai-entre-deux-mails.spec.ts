import {
  attendreSeulementLHeureDuMailNotee,
  redemanderUnAbonnement,
} from '../../../../../test/factories/diffusion/attentes-de-l-abonnement';
import { simulerLHorlogeAChaqueTest } from '../../../../../test/helpers/temps/plancher-de-latence';
import type { StatutDAbonnement } from '../../domain/NewsletterSubscriber';
import { REPONSES_D_ABONNEMENT } from '../SubscribeNewsletter.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const MINUTE_MS = 60_000;

describe('SubscribeNewsletterUseCase · délai entre deux mails', () => {
  simulerLHorlogeAChaqueTest();

  async function redemanderApres(
    minutes: number,
    locale: 'fr' | 'en',
    status: StatutDAbonnement = 'pending',
  ) {
    const resultat = await redemanderUnAbonnement(
      MAINTENANT,
      {
        locale: 'fr',
        status,
        dernierMailLe: new Date(MAINTENANT.getTime() - minutes * MINUTE_MS),
      },
      { locale },
    );
    const languesDesMails =
      resultat.mailer.envoyerLaConfirmation.mock.calls.map(
        ([envoi]) => envoi.locale,
      );
    return { ...resultat, languesDesMails };
  }

  it('NL-10 · envoie un nouveau lien a 10 minutes pile, dans la langue demandee, et note l heure du mail', async () => {
    const { abonne, depot, reponse, languesDesMails } = await redemanderApres(
      10,
      'en',
    );

    expect(reponse).toEqual(REPONSES_D_ABONNEMENT.en);
    expect(languesDesMails).toEqual(['en']);
    attendreSeulementLHeureDuMailNotee(depot, abonne, MAINTENANT);
  });

  it('NL-10 · ne renvoie rien avant 10 minutes, toutes langues, avec la meme reponse', async () => {
    const { depot, mailer, reponse } = await redemanderApres(9, 'en');

    expect(reponse).toEqual(REPONSES_D_ABONNEMENT.en);
    expect(depot.enregistrerLeLien.mock.calls).toEqual([]);
    expect(mailer.envoyerLaConfirmation.mock.calls).toEqual([]);
    expect(depot.mettreAJour.mock.calls).toEqual([]);
  });

  it.each<[string, StatutDAbonnement, 'fr' | 'en']>([
    ['confirme, dans l autre langue', 'confirmed', 'en'],
    ['desabonne, dans sa langue', 'unsubscribed', 'fr'],
    ['en attente, dans l autre langue', 'pending', 'en'],
  ])(
    'NL-06 NL-09 · relance un lien pour un abonne %s sans toucher son abonnement avant le clic',
    async (_cas, status, locale) => {
      const { abonne, depot, languesDesMails } = await redemanderApres(
        60,
        locale,
        status,
      );

      expect(
        depot.enregistrerLeLien.mock.calls.map(([lien]) => lien.locale),
      ).toEqual([locale]);
      expect(languesDesMails).toEqual([locale]);
      attendreSeulementLHeureDuMailNotee(depot, abonne, MAINTENANT);
    },
  );
});
