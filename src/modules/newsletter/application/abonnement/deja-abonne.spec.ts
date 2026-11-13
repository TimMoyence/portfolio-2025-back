import {
  attendreSeulementLHeureDuMailNotee,
  redemanderUnAbonnement,
} from '../../../../../test/factories/diffusion/attentes-de-l-abonnement';
import { simulerLHorlogeAChaqueTest } from '../../../../../test/helpers/temps/plancher-de-latence';
import { REPONSE_D_ABONNEMENT } from '../SubscribeNewsletter.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const IL_Y_A_UNE_HEURE = new Date('2026-11-12T09:00:00.000Z');

describe('SubscribeNewsletterUseCase · déjà abonné', () => {
  simulerLHorlogeAChaqueTest();

  it('NL-18 · envoie a un abonne confirme qui redemande dans sa langue un mail deja abonne avec son lien de desabonnement, sans nouveau lien', async () => {
    const { abonne, depot, mailer, reponse } = await redemanderUnAbonnement(
      MAINTENANT,
      {
        email: 'jane.doe@gmail.com',
        boite: 'janedoe@gmail.com',
        locale: 'en',
        status: 'confirmed',
        dernierMailLe: IL_Y_A_UNE_HEURE,
      },
      { email: 'Jane.Doe+news@Gmail.com', locale: 'en' },
    );

    expect(reponse).toEqual(REPONSE_D_ABONNEMENT);
    expect(mailer.envoyerDejaAbonne.mock.calls).toEqual([
      [
        {
          email: abonne.email,
          locale: 'en',
          jetonDeDesabonnement: abonne.jetonDeDesabonnement,
        },
      ],
    ]);
    expect(depot.enregistrerLeLien.mock.calls).toEqual([]);
    expect(mailer.envoyerLaConfirmation.mock.calls).toEqual([]);
    attendreSeulementLHeureDuMailNotee(depot, abonne, MAINTENANT);
  });
});
