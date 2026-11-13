import {
  buildCommandeDAbonnement,
  createNewsletterDependances,
} from '../../../../test/factories/diffusion/newsletter.factory';
import {
  rendueAuPlancher,
  simulerLHorlogeAChaqueTest,
} from '../../../../test/helpers/temps/plancher-de-latence';
import {
  REPONSE_D_ABONNEMENT,
  SubscribeNewsletterUseCase,
} from './SubscribeNewsletter.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');
const DANS_SEPT_JOURS = new Date('2026-11-19T10:00:00.000Z');

describe('SubscribeNewsletterUseCase · adresse neuve', () => {
  simulerLHorlogeAChaqueTest();

  it('NL-02 · inscrit une adresse neuve en attente dans la langue choisie et lui envoie un lien de 7 jours dans cette langue', async () => {
    jest.setSystemTime(MAINTENANT.getTime());
    const { depot, mailer } = createNewsletterDependances();
    const useCase = new SubscribeNewsletterUseCase(depot, mailer);

    const reponse = await rendueAuPlancher(
      useCase.execute(
        buildCommandeDAbonnement({ email: '  Jane@Mail.COM ', locale: 'en' }),
      ),
    );

    expect(reponse).toEqual(REPONSE_D_ABONNEMENT);
    expect(depot.creer.mock.calls).toEqual([
      [
        expect.objectContaining({
          email: 'jane@mail.com',
          locale: 'en',
          status: 'pending',
        }),
      ],
    ]);
    const liens = depot.enregistrerLeLien.mock.calls.map(([lien]) => lien);
    expect(liens).toEqual([
      {
        jeton: expect.any(String) as string,
        boite: 'jane@mail.com',
        locale: 'en',
        expireLe: DANS_SEPT_JOURS,
      },
    ]);
    expect(mailer.envoyerLaConfirmation.mock.calls).toEqual([
      [
        {
          email: 'jane@mail.com',
          locale: 'en',
          jeton: liens[0].jeton,
          expireLe: DANS_SEPT_JOURS,
        },
      ],
    ]);
  });
});
