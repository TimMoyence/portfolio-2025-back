import { redemanderUnAbonnement } from '../../../../../test/factories/diffusion/attentes-de-l-abonnement';
import { simulerLHorlogeAChaqueTest } from '../../../../../test/helpers/temps/plancher-de-latence';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const REPONSE_ANGLAISE = {
  message:
    'If this address can receive the newsletter, a confirmation email has just been sent. If you receive nothing within a few minutes, try again in 10 minutes.',
};

describe('SubscribeNewsletterUseCase · réponse dans la langue demandée', () => {
  simulerLHorlogeAChaqueTest();

  it('NL-19 · repond en anglais a une demande anglaise, la meme reponse pour toute adresse', async () => {
    const connue = await redemanderUnAbonnement(
      MAINTENANT,
      { status: 'confirmed', locale: 'en' },
      { locale: 'en' },
    );
    const inconnue = await redemanderUnAbonnement(
      MAINTENANT,
      { email: 'autre@mail.com', boite: 'autre@mail.com' },
      { email: 'jane@mail.com', locale: 'en' },
    );

    expect([connue.reponse, inconnue.reponse]).toEqual([
      REPONSE_ANGLAISE,
      REPONSE_ANGLAISE,
    ]);
  });
});
