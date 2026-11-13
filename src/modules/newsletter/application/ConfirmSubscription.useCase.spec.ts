import { attendreLeLienRefuse } from '../../../../test/factories/diffusion/attentes-de-l-abonnement';
import { figerLHeureAChaqueTest } from '../../../../test/helpers/temps/horloge';
import {
  buildAbonne,
  buildLienDeConfirmation,
  createMockNewsletterRepository,
} from '../../../../test/factories/diffusion/newsletter.factory';
import { ConfirmSubscriptionUseCase } from './ConfirmSubscription.useCase';

const MAINTENANT = new Date('2026-11-12T10:00:00.000Z');

function depotDUnAbonne() {
  const depot = createMockNewsletterRepository();
  depot.trouverParBoite.mockResolvedValue(buildAbonne());
  return depot;
}

const confirmerAvec = (
  depot: ReturnType<typeof createMockNewsletterRepository>,
) =>
  attendreLeLienRefuse(
    new ConfirmSubscriptionUseCase(depot).execute('jeton'),
    depot,
  );

describe('ConfirmSubscriptionUseCase', () => {
  figerLHeureAChaqueTest(MAINTENANT);

  it('NL-08 · confirme l abonnement dans la langue du lien clique, le dernier clic l emportant', async () => {
    const depot = createMockNewsletterRepository();
    const abonne = buildAbonne({ locale: 'fr', status: 'confirmed' });
    depot.trouverParBoite.mockResolvedValue(abonne);
    depot.trouverLeLien.mockResolvedValue(
      buildLienDeConfirmation({
        boite: abonne.boite,
        locale: 'en',
        expireLe: new Date(MAINTENANT.getTime() + 1),
      }),
    );

    const resultat = await new ConfirmSubscriptionUseCase(depot).execute(
      'jeton-anglais',
    );

    expect(resultat).toEqual({ status: 'confirmed', locale: 'en' });
    expect(depot.trouverLeLien.mock.calls[0]).toEqual(['jeton-anglais']);
    expect(depot.mettreAJour.mock.calls).toEqual([
      [{ ...abonne, status: 'confirmed', locale: 'en' }],
    ]);
  });

  it('NL-03 · confirme un abonne en attente', async () => {
    const depot = createMockNewsletterRepository();
    const abonne = buildAbonne({ locale: 'fr', status: 'pending' });
    depot.trouverParBoite.mockResolvedValue(abonne);
    depot.trouverLeLien.mockResolvedValue(
      buildLienDeConfirmation({ boite: abonne.boite, locale: 'fr' }),
    );

    await new ConfirmSubscriptionUseCase(depot).execute('jeton');

    expect(depot.mettreAJour.mock.calls).toEqual([
      [{ ...abonne, status: 'confirmed' }],
    ]);
  });

  it.each([
    ['inconnu', null],
    [
      'expire a la milliseconde pres',
      buildLienDeConfirmation({ expireLe: MAINTENANT }),
    ],
  ])('NL-03 · refuse un lien %s en le disant', async (_cas, lien) => {
    const depot = depotDUnAbonne();
    depot.trouverLeLien.mockResolvedValue(lien);

    await confirmerAvec(depot);
  });

  it.each([
    ['supprime par un desabonnement', null],
    [
      'expire pendant l attente du verrou',
      buildLienDeConfirmation({ expireLe: MAINTENANT }),
    ],
  ])(
    'NL-09 · refuse un lien %s entre sa lecture et le verrou de la boite',
    async (_cas, relu) => {
      const depot = depotDUnAbonne();
      depot.trouverLeLien
        .mockResolvedValueOnce(
          buildLienDeConfirmation({
            expireLe: new Date(MAINTENANT.getTime() + 1),
          }),
        )
        .mockResolvedValueOnce(relu);

      await confirmerAvec(depot);
    },
  );
});
