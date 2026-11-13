import { attendreLeLienRefuse } from '../../../../test/factories/diffusion/attentes-de-l-abonnement';
import {
  buildAbonne,
  createMockNewsletterRepository,
} from '../../../../test/factories/diffusion/newsletter.factory';
import type { StatutDAbonnement } from '../domain/NewsletterSubscriber';
import { UnsubscribeNewsletterUseCase } from './UnsubscribeNewsletter.useCase';

async function desabonnerUnAbonne(status: StatutDAbonnement) {
  const depot = createMockNewsletterRepository();
  const abonne = buildAbonne({ status });
  depot.trouverParJetonDeDesabonnement.mockResolvedValue(abonne);
  depot.trouverParBoite.mockResolvedValue(abonne);
  const resultat = await new UnsubscribeNewsletterUseCase(depot).execute(
    abonne.jetonDeDesabonnement,
  );
  return { depot, abonne, resultat };
}

describe('UnsubscribeNewsletterUseCase', () => {
  it('NL-05 NL-09 · desabonne par le lien de desabonnement et invalide les liens de confirmation en cours', async () => {
    const { depot, abonne, resultat } = await desabonnerUnAbonne('confirmed');

    expect(resultat).toEqual({ status: 'unsubscribed' });
    expect(depot.trouverParJetonDeDesabonnement.mock.calls).toEqual([
      [abonne.jetonDeDesabonnement],
    ]);
    expect(depot.mettreAJour.mock.calls).toEqual([
      [{ ...abonne, status: 'unsubscribed' }],
    ]);
    expect(depot.supprimerLesLiensDe.mock.calls).toEqual([[abonne.boite]]);
  });

  it('NL-13 · rejoue sans rien changer et repond desabonne', async () => {
    const { depot, resultat } = await desabonnerUnAbonne('unsubscribed');

    expect(resultat).toEqual({ status: 'unsubscribed' });
    expect(depot.mettreAJour.mock.calls).toEqual([]);
  });

  it('NL-13 · refuse un lien de desabonnement inconnu en le disant', async () => {
    const depot = createMockNewsletterRepository();
    depot.trouverParJetonDeDesabonnement.mockResolvedValue(null);

    await attendreLeLienRefuse(
      new UnsubscribeNewsletterUseCase(depot).execute('inconnu'),
      depot,
    );
  });
});
